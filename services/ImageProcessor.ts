import { ImageTilerSettings } from "../types";
import { WorkerManager } from "./WorkerManager";

export interface ProcessedImageResult {
  imageData: ImageData;
  tiledPattern: ImageData;
  downloadBlob: Blob;
  downloadUrl: string;
}

export class ImageProcessor {
  private static instance: ImageProcessor;

  // Reusable canvas elements to avoid memory allocation
  private tempCanvas: HTMLCanvasElement;
  private tempCtx: CanvasRenderingContext2D;
  private transformCanvas: HTMLCanvasElement;
  private transformCtx: CanvasRenderingContext2D;
  private downloadCanvas: HTMLCanvasElement;
  private downloadCtx: CanvasRenderingContext2D;
  private workerManager: WorkerManager;

  private constructor() {
    // Initialize reusable canvases
    this.tempCanvas = document.createElement("canvas");
    this.tempCtx = this.tempCanvas.getContext("2d", {
      willReadFrequently: true,
    })!;

    this.transformCanvas = document.createElement("canvas");
    this.transformCtx = this.transformCanvas.getContext("2d", {
      willReadFrequently: true,
    })!;

    this.downloadCanvas = document.createElement("canvas");
    this.downloadCtx = this.downloadCanvas.getContext("2d")!;

    // Initialize worker manager
    this.workerManager = WorkerManager.getInstance();
  }

  public static getInstance(): ImageProcessor {
    if (!ImageProcessor.instance) {
      ImageProcessor.instance = new ImageProcessor();
    }
    return ImageProcessor.instance;
  }

  public async processImage(
    originalImage: HTMLImageElement,
    settings: ImageTilerSettings
  ): Promise<ProcessedImageResult> {
    // Use requestIdleCallback for main thread canvas work if available
    const getImageDataAsync = (): Promise<ImageData> => {
      return new Promise((resolve) => {
        requestAnimationFrame(() => {
          // Apply user crop first using reusable canvas
          const crop = settings.crop;
          this.tempCanvas.width = crop.width;
          this.tempCanvas.height = crop.height;

          // Draw cropped portion of original image
          this.tempCtx.drawImage(
            originalImage,
            crop.x,
            crop.y,
            crop.width,
            crop.height,
            0,
            0,
            crop.width,
            crop.height
          );

          const imageData = this.tempCtx.getImageData(
            0,
            0,
            this.tempCanvas.width,
            this.tempCanvas.height
          );

          resolve(imageData);
        });
      });
    };

    let imageData = await getImageDataAsync();

    // Apply rotation and skew asynchronously (needs canvas, keep on main thread)
    imageData = await this.applyTransformAsync(
      imageData,
      settings.rotation,
      settings.skewX,
      settings.skewY
    );

    // Offload heavy processing to web worker
    const { imageData: processedImageData, tiledPattern: tiledImageData } =
      await this.workerManager.processImage(imageData, settings);

    // Create blob for download from the tiled pattern (what user sees in preview)
    const downloadBlob = await this.createDownloadBlob(
      tiledImageData,
      settings.outputFormat,
      settings.jpegQuality
    );

    const downloadUrl = URL.createObjectURL(downloadBlob);

    return {
      imageData: processedImageData,
      tiledPattern: tiledImageData,
      downloadBlob,
      downloadUrl,
    };
  }

  public revokeDownloadUrl(url: string): void {
    if (url) {
      URL.revokeObjectURL(url);
    }
  }

  private async createDownloadBlob(
    imageData: ImageData,
    outputFormat: "jpeg" | "png",
    jpegQuality: number
  ): Promise<Blob> {
    this.downloadCanvas.width = imageData.width;
    this.downloadCanvas.height = imageData.height;

    this.downloadCtx.putImageData(imageData, 0, 0);

    return new Promise<Blob>((resolve, reject) => {
      this.downloadCanvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob"));
          }
        },
        outputFormat === "jpeg" ? "image/jpeg" : "image/png",
        outputFormat === "jpeg" ? jpegQuality / 100 : 1
      );
    });
  }

  private async applyTransformAsync(
    imageData: ImageData,
    rotation: number,
    skewX: number,
    skewY: number
  ): Promise<ImageData> {
    // Skip if no transformation needed
    if (rotation === 0 && skewX === 0 && skewY === 0) {
      return imageData;
    }

    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        const { width, height } = imageData;

        // Calculate dimensions needed for rotation
        const radians = (rotation * Math.PI) / 180;
        const cos = Math.abs(Math.cos(radians));
        const sin = Math.abs(Math.sin(radians));
        const newWidth = Math.ceil(width * cos + height * sin);
        const newHeight = Math.ceil(width * sin + height * cos);

        this.transformCanvas.width = newWidth;
        this.transformCanvas.height = newHeight;

        // Use temp canvas for source image data
        this.tempCanvas.width = width;
        this.tempCanvas.height = height;
        this.tempCtx.putImageData(imageData, 0, 0);

        // Apply transformations
        this.transformCtx.save();
        this.transformCtx.translate(newWidth / 2, newHeight / 2);
        this.transformCtx.rotate(radians);

        // Apply skew
        if (skewX !== 0 || skewY !== 0) {
          const skewXRad = (skewX * Math.PI) / 180;
          const skewYRad = (skewY * Math.PI) / 180;
          this.transformCtx.transform(
            1,
            Math.tan(skewYRad),
            Math.tan(skewXRad),
            1,
            0,
            0
          );
        }

        this.transformCtx.translate(-width / 2, -height / 2);
        this.transformCtx.drawImage(this.tempCanvas, 0, 0);
        this.transformCtx.restore();

        const result = this.transformCtx.getImageData(
          0,
          0,
          this.transformCanvas.width,
          this.transformCanvas.height
        );

        resolve(result);
      });
    });
  }

  // Note: Heavy processing methods moved to web worker
  // Only transformation methods that require canvas remain here
}
