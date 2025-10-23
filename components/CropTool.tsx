import React, { useRef, useEffect, useState } from "react";
import { ImageTilerSettings } from "../types";

interface CropToolProps {
  originalImage: HTMLImageElement | null;
  settings: ImageTilerSettings;
  onCropChange: (crop: ImageTilerSettings["crop"]) => void;
  onClose: () => void;
}

export const CropTool: React.FC<CropToolProps> = ({
  originalImage,
  settings,
  onCropChange,
  onClose,
}) => {
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [tempCrop, setTempCrop] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const handleCropMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropCanvasRef.current || !originalImage) return;

    const canvas = cropCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = originalImage.width / rect.width;
    const scaleY = originalImage.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setIsDragging(true);
    setDragStart({ x, y });
    setTempCrop({ x, y, width: 0, height: 0 });
  };

  const handleCropMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !cropCanvasRef.current || !originalImage) return;

    const canvas = cropCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = originalImage.width / rect.width;
    const scaleY = originalImage.height / rect.height;

    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    const width = currentX - dragStart.x;
    const height = currentY - dragStart.y;

    setTempCrop({
      x: width < 0 ? currentX : dragStart.x,
      y: height < 0 ? currentY : dragStart.y,
      width: Math.abs(width),
      height: Math.abs(height),
    });

    // Draw crop preview
    drawCropPreview();
  };

  const handleCropMouseUp = () => {
    if (!isDragging) return;

    setIsDragging(false);

    // Apply the crop if it's valid (minimum 50x50 pixels)
    if (tempCrop.width > 50 && tempCrop.height > 50) {
      onCropChange({
        x: Math.round(tempCrop.x),
        y: Math.round(tempCrop.y),
        width: Math.round(tempCrop.width),
        height: Math.round(tempCrop.height),
      });
    }

    setTempCrop({ x: 0, y: 0, width: 0, height: 0 });
  };

  const drawCropPreview = () => {
    if (!cropCanvasRef.current || !originalImage) return;

    const canvas = cropCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear and draw original image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

    // Draw current crop area
    const currentCrop = isDragging ? tempCrop : settings.crop;
    if (currentCrop.width > 0 && currentCrop.height > 0) {
      const scaleX = canvas.width / originalImage.width;
      const scaleY = canvas.height / originalImage.height;

      const displayX = currentCrop.x * scaleX;
      const displayY = currentCrop.y * scaleY;
      const displayWidth = currentCrop.width * scaleX;
      const displayHeight = currentCrop.height * scaleY;

      // Darken everything outside crop
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, canvas.width, displayY); // Top
      ctx.fillRect(0, displayY, displayX, displayHeight); // Left
      ctx.fillRect(
        displayX + displayWidth,
        displayY,
        canvas.width - displayX - displayWidth,
        displayHeight
      ); // Right
      ctx.fillRect(
        0,
        displayY + displayHeight,
        canvas.width,
        canvas.height - displayY - displayHeight
      ); // Bottom

      // Draw crop rectangle
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.strokeRect(displayX, displayY, displayWidth, displayHeight);

      // Draw corner handles
      const handleSize = 8;
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(
        displayX - handleSize / 2,
        displayY - handleSize / 2,
        handleSize,
        handleSize
      );
      ctx.fillRect(
        displayX + displayWidth - handleSize / 2,
        displayY - handleSize / 2,
        handleSize,
        handleSize
      );
      ctx.fillRect(
        displayX - handleSize / 2,
        displayY + displayHeight - handleSize / 2,
        handleSize,
        handleSize
      );
      ctx.fillRect(
        displayX + displayWidth - handleSize / 2,
        displayY + displayHeight - handleSize / 2,
        handleSize,
        handleSize
      );
    }
  };

  const resetCrop = () => {
    if (originalImage) {
      onCropChange({
        x: 0,
        y: 0,
        width: originalImage.width,
        height: originalImage.height,
      });
    }
  };

  // Update crop canvas when showing crop tool
  useEffect(() => {
    if (cropCanvasRef.current && originalImage) {
      const canvas = cropCanvasRef.current;
      const maxWidth = 600;
      const maxHeight = 600;
      const scale = Math.min(
        maxWidth / originalImage.width,
        maxHeight / originalImage.height,
        1
      );

      canvas.width = originalImage.width * scale;
      canvas.height = originalImage.height * scale;

      drawCropPreview();
    }
  }, [originalImage, settings.crop, tempCrop]);

  if (!originalImage) return null;

  return (
    <div className="border rounded-lg p-3">
      <h3 className="text-sm font-semibold mb-2 text-gray-700">Crop Image</h3>
      <button
        onClick={onClose}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded text-sm transition-colors"
      >
        Cancel Crop
      </button>
      <div className="mt-2 text-xs text-gray-600">
        <p>
          Current size: {settings.crop.width}x{settings.crop.height} px
        </p>
        {settings.crop.width !== originalImage.width ||
        settings.crop.height !== originalImage.height ? (
          <p className="text-blue-600 font-medium mt-1">
            ✓ Custom crop applied
          </p>
        ) : (
          <p className="text-gray-500 mt-1">Using full image</p>
        )}
      </div>

      <div className="mt-4">
        <div className="relative">
          <canvas
            ref={cropCanvasRef}
            className="cursor-crosshair"
            onMouseDown={handleCropMouseDown}
            onMouseMove={handleCropMouseMove}
            onMouseUp={handleCropMouseUp}
            onMouseLeave={handleCropMouseUp}
          />
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Crop: {Math.round(settings.crop.width)}x
              {Math.round(settings.crop.height)} px
            </p>
            <button
              onClick={resetCrop}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Reset to Full Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
