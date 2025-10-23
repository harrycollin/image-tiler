"use client";

import { useState, useRef, useEffect } from "react";
import { ImageTilerSettings } from "../types";
import { ImagePreview, SettingsPanel, CropTool } from ".";
import { useImageProcessing } from "../hooks/useImageProcessing";
import { useImageUpload } from "../hooks/useImageUpload";

export default function ImageTiler() {
  // Use custom hooks for image processing and upload management
  const { selectedFile, originalImage, initialCropSettings, handleFileSelect } =
    useImageUpload();
  const {
    isProcessing,
    processedResult,
    processImage,
    downloadProcessedImage,
  } = useImageProcessing();

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
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showCropTool, setShowCropTool] = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Derive the actual crop to use: if settings.crop is still default (0,0,0,0), use initialCropSettings
  const effectiveCrop =
    settings.crop.width === 0 &&
    settings.crop.height === 0 &&
    initialCropSettings
      ? initialCropSettings
      : settings.crop;

  // Auto-process when image or settings change with debounce
  useEffect(() => {
    if (originalImage && !showCropTool) {
      // Clear existing timeout
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }

      // Debounce processing to prevent excessive calls
      processingTimeoutRef.current = setTimeout(() => {
        const settingsWithEffectiveCrop = { ...settings, crop: effectiveCrop };
        processImage(originalImage, settingsWithEffectiveCrop).catch(
          (error) => {
            console.error("Error processing image:", error);
            alert("Error processing image. Please try again.");
          }
        );
      }, 50); // 50ms debounce - fast response while preventing rapid-fire updates
    }

    // Cleanup timeout on unmount
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, [originalImage, settings, effectiveCrop, showCropTool, processImage]);

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
          // Processing will be triggered by the useEffect when showCropTool changes
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
              processedResult={processedResult}
              showCropTool={showCropTool}
              zoomLevel={zoomLevel}
              onZoomChange={setZoomLevel}
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
              onProcessImage={() => {
                // Processing will be triggered by the useEffect when settings change
              }}
              onDownload={() => downloadProcessedImage(settings)}
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
