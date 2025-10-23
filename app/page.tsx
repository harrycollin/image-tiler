"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ImageTilerSettings } from "../types";
import {
  applyTransform,
  applyPreCrop,
  applyPreAveraging,
  applySeamlessTexture,
  createTiledPattern,
} from "../utils/imageProcessing";
import { ImagePreview, SettingsPanel, CropTool } from "../components";

export default function ImageTiler() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(
    null
  );
  const [settings, setSettings] = useState<ImageTilerSettings>({
    method: "none",
    tileFormat: "2x2",
    markSeams: "disabled",
    crop: { x: 0, y: 0, width: 0, height: 0 },
    rotation: 0,
    skewX: 0,
    skewY: 0,
    preCrop: { left: 2, top: 2, bottom: 2, right: 2 },
    preAveraging: { intensity: 0, radius: 5 },
    outputFormat: "jpeg",
    jpegQuality: 92,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImageUrl, setProcessedImageUrl] = useState<string>("");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showOriginal, setShowOriginal] = useState(false);
  const [showCropTool, setShowCropTool] = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setProcessedImageUrl("");
      setShowCropTool(false);

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setOriginalImage(img);
          // Initialize crop to full image
          setSettings((prev) => ({
            ...prev,
            crop: { x: 0, y: 0, width: img.width, height: img.height },
          }));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = useCallback(async () => {
    if (!originalImage) return;

    setIsProcessing(true);

    try {
      // Create temporary canvas to get image data
      const tempCanvas = document.createElement("canvas");

      // Apply user crop first
      const crop = settings.crop;
      tempCanvas.width = crop.width;
      tempCanvas.height = crop.height;

      const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });

      if (!tempCtx) {
        throw new Error("Could not get canvas context");
      }

      // Draw cropped portion of original image
      tempCtx.drawImage(
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

      let imageData = tempCtx.getImageData(
        0,
        0,
        tempCanvas.width,
        tempCanvas.height
      );

      // Apply rotation and skew
      imageData = applyTransform(
        imageData,
        settings.rotation,
        settings.skewX,
        settings.skewY
      );

      // Apply pre-crop
      imageData = applyPreCrop(imageData, settings.preCrop);

      // Apply pre-averaging
      imageData = applyPreAveraging(
        imageData,
        settings.preAveraging.intensity,
        settings.preAveraging.radius
      );

      // Apply seamless texture method
      imageData = applySeamlessTexture(imageData, settings.method);

      // Create tiled pattern
      const tiledImageData = createTiledPattern(
        imageData,
        settings.tileFormat,
        settings.markSeams === "enabled"
      );

      // Draw to preview canvas
      if (previewCanvasRef.current) {
        const canvas = previewCanvasRef.current;
        canvas.width = tiledImageData.width;
        canvas.height = tiledImageData.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.putImageData(tiledImageData, 0, 0);
        }
      }

      // Create blob for download - use the single processed tile (not the tiled pattern)
      const downloadCanvas = document.createElement("canvas");
      downloadCanvas.width = imageData.width;
      downloadCanvas.height = imageData.height;
      const downloadCtx = downloadCanvas.getContext("2d");

      if (downloadCtx) {
        downloadCtx.putImageData(imageData, 0, 0);

        const blob = await new Promise<Blob>((resolve, reject) => {
          downloadCanvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("Failed to create blob"));
              }
            },
            settings.outputFormat === "jpeg" ? "image/jpeg" : "image/png",
            settings.outputFormat === "jpeg" ? settings.jpegQuality / 100 : 1
          );
        });

        const url = URL.createObjectURL(blob);

        // Revoke old URL if exists
        if (processedImageUrl) {
          URL.revokeObjectURL(processedImageUrl);
        }

        setProcessedImageUrl(url);
      }
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Error processing image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [originalImage, settings, processedImageUrl]);

  // Auto-process when image or settings change
  useEffect(() => {
    if (originalImage && !showCropTool) {
      processImage();
    }
  }, [originalImage, settings, processImage, showCropTool]);

  // Re-process to show the tiled output when not showing original
  useEffect(() => {
    if (!showOriginal && originalImage && !showCropTool) {
      processImage();
    }
  }, [showOriginal, originalImage, processImage, showCropTool]);

  const downloadProcessedImage = () => {
    if (!previewCanvasRef.current) return;

    // Download the current preview canvas content
    previewCanvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `seamless-texture-${settings.tileFormat}.${settings.outputFormat}`;
          link.click();
          URL.revokeObjectURL(url);
        }
      },
      settings.outputFormat === "jpeg" ? "image/jpeg" : "image/png",
      settings.outputFormat === "jpeg" ? settings.jpegQuality / 100 : 1
    );
  };

  const handleCropToolToggle = () => {
    setShowCropTool(!showCropTool);
  };

  const handleCropChange = (crop: ImageTilerSettings["crop"]) => {
    setSettings((prev) => ({ ...prev, crop }));
  };

  const cropToolComponent =
    showCropTool && originalImage ? (
      <CropTool
        originalImage={originalImage}
        settings={settings}
        onCropChange={handleCropChange}
        onClose={() => {
          setShowCropTool(false);
          processImage();
        }}
      />
    ) : null;

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      <div className="max-w-full mx-auto px-4 py-6 h-full">
        <div className="bg-white rounded-lg shadow-lg p-6 h-full flex flex-col">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
            Visual Image Tiler
          </h1>

          <div className="flex flex-1 min-h-0 gap-6">
            {/* Main Output Display - Left Side */}
            <ImagePreview
              ref={previewCanvasRef}
              originalImage={originalImage}
              settings={settings}
              showOriginal={showOriginal}
              showCropTool={showCropTool}
              zoomLevel={zoomLevel}
              onZoomChange={setZoomLevel}
              onToggleOriginal={() => setShowOriginal(!showOriginal)}
              cropToolComponent={cropToolComponent}
            />

            {/* Settings Panel - Right Side */}
            <SettingsPanel
              selectedFile={selectedFile}
              originalImage={originalImage}
              settings={settings}
              isProcessing={isProcessing}
              showCropTool={showCropTool}
              onFileSelect={handleFileSelect}
              onSettingsChange={setSettings}
              onCropToolToggle={handleCropToolToggle}
              onProcessImage={processImage}
              onDownload={downloadProcessedImage}
            />
          </div>

          {/* GitHub Link */}
          <div className="mt-4 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
            <a
              href="https://github.com/harrycollin/image-tiler"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-700 inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                  clipRule="evenodd"
                />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
