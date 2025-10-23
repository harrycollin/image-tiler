import React, { useEffect, forwardRef, useState } from "react";
import { ImageTilerSettings } from "../types";

interface ImagePreviewProps {
  originalImage: HTMLImageElement | null;
  settings: ImageTilerSettings;
  showOriginal: boolean;
  showCropTool: boolean;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  onToggleOriginal: () => void;
  cropToolComponent?: React.ReactNode;
}

const ImagePreviewComponent = forwardRef<HTMLCanvasElement, ImagePreviewProps>(
  (
    {
      originalImage,
      settings,
      showOriginal,
      showCropTool,
      zoomLevel,
      onZoomChange,
      onToggleOriginal,
      cropToolComponent,
    },
    ref
  ) => {
    // Panning state
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

    // Handle scroll wheel zoom
    const handleWheel = (e: React.WheelEvent) => {
      if (showCropTool) return; // Don't zoom during crop tool

      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.25, Math.min(3, zoomLevel + delta));
      onZoomChange(newZoom);
    };

    // Handle mouse down for panning
    const handleMouseDown = (e: React.MouseEvent) => {
      if (showCropTool || zoomLevel <= 1) return; // Don't pan during crop tool or when not zoomed

      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    };

    // Handle mouse move for panning
    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isPanning) return;

      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    };

    // Handle mouse up for panning
    const handleMouseUp = () => {
      setIsPanning(false);
    };
    // Render original image in preview when showOriginal is true
    useEffect(() => {
      if (
        showOriginal &&
        originalImage &&
        ref &&
        typeof ref !== "function" &&
        ref.current
      ) {
        const canvas = ref.current;
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
    }, [showOriginal, originalImage, settings.crop, ref]);

    return (
      <div className="flex-1 min-h-0">
        <div className="bg-gray-100 rounded-lg p-6 h-full flex flex-col">
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

          <div
            className="flex justify-center items-center flex-1 bg-white rounded border-2 border-gray-300 overflow-auto p-4"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              cursor: isPanning
                ? "grabbing"
                : zoomLevel > 1 && !showCropTool
                ? "grab"
                : "default",
            }}
          >
            {originalImage ? (
              showCropTool ? (
                cropToolComponent
              ) : (
                <div
                  className="relative"
                  style={{
                    transform: `scale(${zoomLevel}) translate(${
                      panOffset.x / zoomLevel
                    }px, ${panOffset.y / zoomLevel}px)`,
                    transformOrigin: "center",
                    transition: isPanning ? "none" : "transform 0.2s",
                  }}
                >
                  <canvas
                    ref={ref}
                    className="max-w-full max-h-full"
                    style={{
                      imageRendering: "pixelated",
                      display: "block",
                    }}
                  />
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
        </div>
      </div>
    );
  }
);

ImagePreviewComponent.displayName = "ImagePreview";

export const ImagePreview = ImagePreviewComponent;
