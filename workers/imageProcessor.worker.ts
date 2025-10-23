import type { ImageTilerSettings } from "../types/index";
import {
  applyPreCrop,
  applyPreAveraging,
  applySeamlessTexture,
  createTiledPattern,
} from "../services/imageProcessingFunctions";

export interface WorkerProcessRequest {
  type: "process";
  id: string;
  imageData: ImageData;
  settings: ImageTilerSettings;
}

export interface WorkerProcessResponse {
  type: "process-complete";
  id: string;
  imageData: ImageData;
  tiledPattern: ImageData;
}

export interface WorkerErrorResponse {
  type: "error";
  id: string;
  error: string;
}

// Process messages from main thread
self.onmessage = (event: MessageEvent<WorkerProcessRequest>) => {
  const { type, id, imageData, settings } = event.data;

  if (type === "process") {
    try {
      // Apply transformations step by step using shared functions
      let processedImageData = imageData;

      // Apply pre-crop
      processedImageData = applyPreCrop(processedImageData, settings.preCrop);

      // Apply pre-averaging
      processedImageData = applyPreAveraging(
        processedImageData,
        settings.preAveraging.intensity,
        settings.preAveraging.radius
      );

      // Skip seamless texture methods here - they will be applied after tiling
      // (All methods need to work on the tiled pattern seams, not individual tile edges)

      // Create tiled pattern
      let tiledImageData = createTiledPattern(
        processedImageData,
        settings.tileFormat,
        settings.markSeams === "enabled",
        settings.mirrorTiles
      );

      // Apply seamless texture method to the tiled pattern
      if (settings.method !== "none") {
        tiledImageData = applySeamlessTexture(
          tiledImageData,
          settings.method,
          settings.colorHarmonization
        );
      }

      const response: WorkerProcessResponse = {
        type: "process-complete",
        id,
        imageData: processedImageData,
        tiledPattern: tiledImageData,
      };

      // Transfer the ImageData buffers back to main thread (zero-copy)
      // @ts-expect-error - Worker postMessage accepts transfer array as second argument
      self.postMessage(response, [
        processedImageData.data.buffer,
        tiledImageData.data.buffer,
      ]);
    } catch (error) {
      const errorResponse: WorkerErrorResponse = {
        type: "error",
        id,
        error: error instanceof Error ? error.message : "Unknown error",
      };
      self.postMessage(errorResponse);
    }
  }
};
