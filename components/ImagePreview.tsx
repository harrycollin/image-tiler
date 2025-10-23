import React, {
  useEffect,
  forwardRef,
  useState,
  useCallback,
  useRef,
} from "react";
import { ProcessedImageResult } from "../services/ImageProcessor";

interface ImagePreviewProps {
  processedResult: ProcessedImageResult | null;
  showCropTool: boolean;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  cropToolComponent?: React.ReactNode;
}

const ImagePreviewComponent = forwardRef<HTMLCanvasElement, ImagePreviewProps>(
  (
    {
      processedResult,
      showCropTool,
      zoomLevel,
      onZoomChange,
      cropToolComponent,
    },
    ref
  ) => {
    const [isPanning, setIsPanning] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const lastProcessedResultRef = useRef<ProcessedImageResult | null>(null);

    // Handle wheel zoom
    const handleWheel = useCallback(
      (e: React.WheelEvent) => {
        if (showCropTool) return;

        e.preventDefault();
        e.stopPropagation();

        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(0.1, Math.min(5, zoomLevel + delta));
        onZoomChange(newZoom);
      },
      [showCropTool, zoomLevel, onZoomChange]
    );

    // Handle mouse down
    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (showCropTool) return;

        e.preventDefault();
        setIsPanning(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      },
      [showCropTool, offset]
    );

    // Handle mouse move
    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        if (!isPanning) return;

        e.preventDefault();
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        setOffset({ x: newX, y: newY });
      },
      [isPanning, dragStart]
    );

    // Handle mouse up
    const handleMouseUp = useCallback(() => {
      setIsPanning(false);
    }, []);

    // Global mouse up handler
    useEffect(() => {
      if (isPanning) {
        const handleGlobalMouseUp = () => setIsPanning(false);
        document.addEventListener("mouseup", handleGlobalMouseUp);
        return () =>
          document.removeEventListener("mouseup", handleGlobalMouseUp);
      }
    }, [isPanning]);

    // Reset zoom and pan
    const handleReset = useCallback(() => {
      onZoomChange(1);
      setOffset({ x: 0, y: 0 });
    }, [onZoomChange]);

    // Draw the image on the canvas
    const drawCanvas = useCallback(() => {
      if (
        !ref ||
        typeof ref === "function" ||
        !ref.current ||
        !containerRef.current ||
        !processedResult
      ) {
        return;
      }

      const canvas = ref.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      // Set canvas size to match container
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create or update temporary canvas with the image data
      // Recreate if processedResult changed
      if (lastProcessedResultRef.current !== processedResult) {
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) return;

        const imageData = processedResult.tiledPattern;
        tempCanvas.width = imageData.width;
        tempCanvas.height = imageData.height;
        tempCtx.putImageData(imageData, 0, 0);

        tempCanvasRef.current = tempCanvas;
        lastProcessedResultRef.current = processedResult;
      }

      if (!tempCanvasRef.current) return;

      const tempCanvas = tempCanvasRef.current;
      const imgWidth = tempCanvas.width;
      const imgHeight = tempCanvas.height;

      // Calculate scaled dimensions
      const scaledWidth = imgWidth * zoomLevel;
      const scaledHeight = imgHeight * zoomLevel;

      // Calculate centered position
      const x = (canvas.width - scaledWidth) / 2 + offset.x;
      const y = (canvas.height - scaledHeight) / 2 + offset.y;

      // Disable image smoothing for crisp pixel rendering
      ctx.imageSmoothingEnabled = false;

      // Draw the image
      ctx.drawImage(tempCanvas, x, y, scaledWidth, scaledHeight);
    }, [ref, zoomLevel, offset, processedResult]);

    // Redraw when dependencies change
    useEffect(() => {
      drawCanvas();
    }, [drawCanvas]);

    // Handle window resize
    useEffect(() => {
      const handleResize = () => {
        drawCanvas();
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [drawCanvas]);

    return (
      <div className="flex-1 min-h-0">
        <div className="bg-gray-100 rounded-lg p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {showCropTool
                ? "Crop Tool - Drag to select area"
                : "Seamless Texture Output"}
            </h2>
            <div className="flex items-center space-x-4">
              {!showCropTool && processedResult && (
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Zoom:</label>
                  <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={zoomLevel}
                    onChange={(e) => onZoomChange(parseFloat(e.target.value))}
                    className="w-32"
                  />
                  <span className="text-sm text-gray-600 min-w-[3rem]">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={handleReset}
                    className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
                    title="Reset zoom and position"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
          </div>

          <div
            ref={containerRef}
            className="flex-1 bg-white rounded border-2 border-gray-300 min-h-0 relative overflow-hidden"
            style={{ userSelect: "none" }}
          >
            {processedResult ? (
              showCropTool ? (
                <div className="w-full h-full p-4">{cropToolComponent}</div>
              ) : (
                <canvas
                  ref={ref}
                  className="absolute inset-0 w-full h-full"
                  style={{
                    cursor: isPanning ? "grabbing" : "grab",
                    imageRendering: "pixelated",
                  }}
                  onWheel={handleWheel}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
              )
            ) : (
              <div className="flex items-center justify-center h-full text-center text-gray-500">
                <div>
                  <div className="text-6xl mb-4">🖼️</div>
                  <p className="text-lg">
                    Upload an image to see the seamless texture output
                  </p>
                </div>
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
