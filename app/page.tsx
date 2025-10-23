"use client";

import { useState, useRef, useEffect } from "react";
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
    method: "method2",
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

  const processImage = async () => {
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
  };

  // Auto-process when image or settings change
  useEffect(() => {
    if (originalImage && !showCropTool) {
      processImage();
    }
  }, [originalImage, settings]);

  // Re-process to show the tiled output when not showing original
  useEffect(() => {
    if (!showOriginal && originalImage && !showCropTool) {
      processImage();
    }
  }, [showOriginal, originalImage]);

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
            Visual Image Tiler
          </h1>
          <p className="text-center text-gray-600 mb-6">
            The original image is not changed. You will get processed texture
            and tile to check its seamlessness.
          </p>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Main Output Display - Left Side */}
            <ImagePreview
              originalImage={originalImage}
              settings={settings}
              processedImageUrl={processedImageUrl}
              isProcessing={isProcessing}
              showOriginal={showOriginal}
              showCropTool={showCropTool}
              zoomLevel={zoomLevel}
              onZoomChange={setZoomLevel}
              onToggleOriginal={() => setShowOriginal(!showOriginal)}
              onDownload={downloadProcessedImage}
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
              onCropChange={handleCropChange}
              onProcessImage={processImage}
            />
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
            <div className="flex justify-center space-x-4 mb-2">
              <a href="#" className="hover:text-gray-700">
                Contact
              </a>
              <a href="#" className="hover:text-gray-700">
                Site map
              </a>
              <a href="#" className="hover:text-gray-700">
                limitations
              </a>
              <a href="#" className="hover:text-gray-700">
                Ukrainian version
              </a>
            </div>
            <p>© 2024 Image Tiler. Inspired by www.imgonline.com.ua</p>
          </div>
        </div>
      </div>
    </div>
  );
}
