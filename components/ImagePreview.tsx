import React, { useRef, useEffect } from "react";
import { ImageTilerSettings } from "../types";

interface ImagePreviewProps {
  originalImage: HTMLImageElement | null;
  settings: ImageTilerSettings;
  processedImageUrl: string;
  isProcessing: boolean;
  showOriginal: boolean;
  showCropTool: boolean;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  onToggleOriginal: () => void;
  onDownload: () => void;
  cropToolComponent?: React.ReactNode;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  originalImage,
  settings,
  processedImageUrl,
  isProcessing,
  showOriginal,
  showCropTool,
  zoomLevel,
  onZoomChange,
  onToggleOriginal,
  onDownload,
  cropToolComponent,
}) => {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Render original image in preview when showOriginal is true
  useEffect(() => {
    if (showOriginal && originalImage && previewCanvasRef.current) {
      const canvas = previewCanvasRef.current;
      const crop = settings.crop;
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(
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
      }
    }
  }, [showOriginal, originalImage, settings.crop]);

  return (
    <div className="xl:col-span-3">
      <div className="bg-gray-100 rounded-lg p-6 min-h-[750px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {showCropTool
              ? "Crop Tool - Drag to select area"
              : showOriginal
              ? "Original Image (Cropped)"
              : "Seamless Texture Output"}
          </h2>
          <div className="flex items-center space-x-4">
            {!showCropTool && (
              <>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Zoom:</label>
                  <input
                    type="range"
                    min="0.25"
                    max="3"
                    step="0.25"
                    value={zoomLevel}
                    onChange={(e) => onZoomChange(parseFloat(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-600 w-12">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                </div>
                <button
                  onClick={onToggleOriginal}
                  className={`px-3 py-1 text-sm rounded ${
                    showOriginal
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {showOriginal ? "Show Processed" : "Show Original"}
                </button>
              </>
            )}
            {showCropTool && (
              <button
                onClick={() => {
                  // This will be handled by the parent component
                }}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Apply Crop
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-center items-center min-h-[600px] bg-white rounded border-2 border-gray-300 overflow-auto p-4">
          {originalImage ? (
            showCropTool ? (
              cropToolComponent
            ) : (
              <div
                className="relative"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: "center",
                  transition: "transform 0.2s",
                }}
              >
                <canvas
                  ref={previewCanvasRef}
                  className="max-w-full max-h-full"
                  style={{
                    imageRendering: "pixelated",
                    display: "block",
                  }}
                />
                {isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                    <div className="text-center text-gray-600">
                      <div className="text-4xl mb-2">⚙️</div>
                      <p className="text-sm font-medium">
                        Processing seamless texture...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">🖼️</div>
              <p className="text-lg">
                Upload an image to see the seamless texture output
              </p>
            </div>
          )}
        </div>

        {/* Download Button */}
        {processedImageUrl && !isProcessing && !showCropTool && (
          <div className="mt-4 text-center">
            <button
              onClick={onDownload}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded transition-colors"
            >
              Download Processed Texture
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
