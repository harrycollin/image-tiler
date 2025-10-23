"use client";

import { useState, useRef, useEffect } from "react";

interface ImageTilerSettings {
  method: "none" | "method1" | "method2" | "method3";
  tileFormat: "1x1" | "2x2" | "3x3" | "4x4";
  markSeams: "enabled" | "disabled";
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  rotation: number; // degrees
  skewX: number; // degrees
  skewY: number; // degrees
  preCrop: {
    left: number;
    top: number;
    bottom: number;
    right: number;
  };
  preAveraging: {
    intensity: number;
    radius: number;
  };
  outputFormat: "jpeg" | "png";
  jpegQuality: number;
}

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
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [tempCrop, setTempCrop] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [preCropLocked, setPreCropLocked] = useState(true);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);

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
      setSettings((prev) => ({
        ...prev,
        crop: {
          x: Math.round(tempCrop.x),
          y: Math.round(tempCrop.y),
          width: Math.round(tempCrop.width),
          height: Math.round(tempCrop.height),
        },
      }));
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
      setSettings((prev) => ({
        ...prev,
        crop: {
          x: 0,
          y: 0,
          width: originalImage.width,
          height: originalImage.height,
        },
      }));
    }
  };

  const applyTransform = (
    imageData: ImageData,
    rotation: number,
    skewX: number,
    skewY: number
  ): ImageData => {
    // Skip if no transformation needed
    if (rotation === 0 && skewX === 0 && skewY === 0) {
      return imageData;
    }

    const { width, height } = imageData;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) return imageData;

    // Calculate dimensions needed for rotation
    const radians = (rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(radians));
    const sin = Math.abs(Math.sin(radians));
    const newWidth = Math.ceil(width * cos + height * sin);
    const newHeight = Math.ceil(width * sin + height * cos);

    canvas.width = newWidth;
    canvas.height = newHeight;

    // Create temporary canvas for source image
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext("2d");
    if (tempCtx) {
      tempCtx.putImageData(imageData, 0, 0);
    }

    // Apply transformations
    ctx.save();
    ctx.translate(newWidth / 2, newHeight / 2);
    ctx.rotate(radians);

    // Apply skew
    if (skewX !== 0 || skewY !== 0) {
      const skewXRad = (skewX * Math.PI) / 180;
      const skewYRad = (skewY * Math.PI) / 180;
      ctx.transform(1, Math.tan(skewYRad), Math.tan(skewXRad), 1, 0, 0);
    }

    ctx.translate(-width / 2, -height / 2);
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.restore();

    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  };

  const applyPreCrop = (
    imageData: ImageData,
    crop: ImageTilerSettings["preCrop"]
  ): ImageData => {
    const { data, width, height } = imageData;
    const newWidth = Math.max(1, width - crop.left - crop.right);
    const newHeight = Math.max(1, height - crop.top - crop.bottom);
    const newData = new Uint8ClampedArray(newWidth * newHeight * 4);

    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        const sourceIdx = ((y + crop.top) * width + (x + crop.left)) * 4;
        const targetIdx = (y * newWidth + x) * 4;
        newData[targetIdx] = data[sourceIdx];
        newData[targetIdx + 1] = data[sourceIdx + 1];
        newData[targetIdx + 2] = data[sourceIdx + 2];
        newData[targetIdx + 3] = data[sourceIdx + 3];
      }
    }

    return new ImageData(newData, newWidth, newHeight);
  };

  const applyPreAveraging = (
    imageData: ImageData,
    intensity: number,
    radius: number
  ): ImageData => {
    if (intensity === 0) return imageData;

    const { data, width, height } = imageData;
    const newData = new Uint8ClampedArray(data);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;

        let rSum = 0,
          gSum = 0,
          bSum = 0,
          count = 0;

        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const sampleIdx = (ny * width + nx) * 4;
              rSum += data[sampleIdx];
              gSum += data[sampleIdx + 1];
              bSum += data[sampleIdx + 2];
              count++;
            }
          }
        }

        const avgR = rSum / count;
        const avgG = gSum / count;
        const avgB = bSum / count;

        const factor = intensity / 100;
        newData[idx] = data[idx] * (1 - factor) + avgR * factor;
        newData[idx + 1] = data[idx + 1] * (1 - factor) + avgG * factor;
        newData[idx + 2] = data[idx + 2] * (1 - factor) + avgB * factor;
      }
    }

    return new ImageData(newData, width, height);
  };

  const applySeamlessTexture = (
    imageData: ImageData,
    method: string
  ): ImageData => {
    const { data, width, height } = imageData;
    const newData = new Uint8ClampedArray(data);

    switch (method) {
      case "none":
        // No processing - return original image data
        return imageData;

      case "method1":
        // Simple edge blending
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const edgeDistance = Math.min(x, width - 1 - x, y, height - 1 - y);

            if (edgeDistance < 20) {
              const blendFactor = edgeDistance / 20;
              const oppositeX = x < width / 2 ? width - 1 - x : x - width / 2;
              const oppositeY =
                y < height / 2 ? height - 1 - y : y - height / 2;

              const oppositeIdx = (oppositeY * width + oppositeX) * 4;

              newData[idx] =
                data[idx] * blendFactor + data[oppositeIdx] * (1 - blendFactor);
              newData[idx + 1] =
                data[idx + 1] * blendFactor +
                data[oppositeIdx + 1] * (1 - blendFactor);
              newData[idx + 2] =
                data[idx + 2] * blendFactor +
                data[oppositeIdx + 2] * (1 - blendFactor);
            }
          }
        }
        break;

      case "method2":
        // Offset method - blend edges with opposite edges
        const blendWidth = Math.floor(width * 0.1);
        const blendHeight = Math.floor(height * 0.1);

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            let blendFactor = 1.0;
            let oppositeIdx = idx;

            // Left edge blending with right edge
            if (x < blendWidth) {
              blendFactor = x / blendWidth;
              const oppositeX = width - blendWidth + x;
              oppositeIdx = (y * width + oppositeX) * 4;
            }
            // Right edge blending with left edge
            else if (x >= width - blendWidth) {
              blendFactor = (width - 1 - x) / blendWidth;
              const oppositeX = x - (width - blendWidth);
              oppositeIdx = (y * width + oppositeX) * 4;
            }
            // Top edge blending with bottom edge
            else if (y < blendHeight) {
              blendFactor = y / blendHeight;
              const oppositeY = height - blendHeight + y;
              oppositeIdx = (oppositeY * width + x) * 4;
            }
            // Bottom edge blending with top edge
            else if (y >= height - blendHeight) {
              blendFactor = (height - 1 - y) / blendHeight;
              const oppositeY = y - (height - blendHeight);
              oppositeIdx = (oppositeY * width + x) * 4;
            }

            if (blendFactor < 1.0) {
              newData[idx] =
                data[idx] * blendFactor + data[oppositeIdx] * (1 - blendFactor);
              newData[idx + 1] =
                data[idx + 1] * blendFactor +
                data[oppositeIdx + 1] * (1 - blendFactor);
              newData[idx + 2] =
                data[idx + 2] * blendFactor +
                data[oppositeIdx + 2] * (1 - blendFactor);
            }
          }
        }
        break;

      case "method3":
        // Advanced seamless blending using gradient-based approach
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;

            // Calculate distance from edges
            const distFromLeft = x / width;
            const distFromRight = (width - 1 - x) / width;
            const distFromTop = y / height;
            const distFromBottom = (height - 1 - y) / height;

            // Use a smooth gradient for blending
            const minDistX = Math.min(distFromLeft, distFromRight);
            const minDistY = Math.min(distFromTop, distFromBottom);
            const edgeFactor = Math.min(minDistX, minDistY);

            if (edgeFactor < 0.15) {
              const blendFactor = edgeFactor / 0.15;

              // Calculate opposite position
              const oppositeX = (width - 1 - x) % width;
              const oppositeY = (height - 1 - y) % height;
              const oppositeIdx = (oppositeY * width + oppositeX) * 4;

              newData[idx] =
                data[idx] * blendFactor + data[oppositeIdx] * (1 - blendFactor);
              newData[idx + 1] =
                data[idx + 1] * blendFactor +
                data[oppositeIdx + 1] * (1 - blendFactor);
              newData[idx + 2] =
                data[idx + 2] * blendFactor +
                data[oppositeIdx + 2] * (1 - blendFactor);
            }
          }
        }
        break;
    }

    return new ImageData(newData, width, height);
  };

  const createTiledPattern = (
    imageData: ImageData,
    tileFormat: string,
    markSeams: boolean
  ): ImageData => {
    const { width: tileWidth, height: tileHeight, data } = imageData;
    const [rows, cols] = tileFormat.split("x").map(Number);

    const patternWidth = tileWidth * cols;
    const patternHeight = tileHeight * rows;
    const patternData = new Uint8ClampedArray(patternWidth * patternHeight * 4);

    // Copy tiles
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        for (let y = 0; y < tileHeight; y++) {
          for (let x = 0; x < tileWidth; x++) {
            const sourceIdx = (y * tileWidth + x) * 4;
            const targetX = col * tileWidth + x;
            const targetY = row * tileHeight + y;
            const targetIdx = (targetY * patternWidth + targetX) * 4;

            patternData[targetIdx] = data[sourceIdx];
            patternData[targetIdx + 1] = data[sourceIdx + 1];
            patternData[targetIdx + 2] = data[sourceIdx + 2];
            patternData[targetIdx + 3] = data[sourceIdx + 3];
          }
        }
      }
    }

    // Mark seams if enabled
    if (markSeams) {
      for (let row = 0; row <= rows; row++) {
        for (let x = 0; x < patternWidth; x++) {
          const y = row * tileHeight;
          if (y < patternHeight) {
            const idx = (y * patternWidth + x) * 4;
            patternData[idx] = 255;
            patternData[idx + 1] = 0;
            patternData[idx + 2] = 0;
            patternData[idx + 3] = 255;
          }
        }
      }

      for (let col = 0; col <= cols; col++) {
        for (let y = 0; y < patternHeight; y++) {
          const x = col * tileWidth;
          if (x < patternWidth) {
            const idx = (y * patternWidth + x) * 4;
            patternData[idx] = 255;
            patternData[idx + 1] = 0;
            patternData[idx + 2] = 0;
            patternData[idx + 3] = 255;
          }
        }
      }
    }

    return new ImageData(patternData, patternWidth, patternHeight);
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
    } else if (!showOriginal && originalImage && !showCropTool) {
      // Re-process to show the tiled output
      processImage();
    }
  }, [showOriginal, originalImage]);

  // Update crop canvas when showing crop tool
  useEffect(() => {
    if (showCropTool && cropCanvasRef.current && originalImage) {
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
  }, [showCropTool, originalImage, settings.crop, tempCrop]);

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
                            onChange={(e) =>
                              setZoomLevel(parseFloat(e.target.value))
                            }
                            className="w-20"
                          />
                          <span className="text-sm text-gray-600 w-12">
                            {Math.round(zoomLevel * 100)}%
                          </span>
                        </div>
                        <button
                          onClick={() => setShowOriginal(!showOriginal)}
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
                          setShowCropTool(false);
                          processImage();
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
                      onClick={downloadProcessedImage}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded transition-colors"
                    >
                      Download Processed Texture
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Settings Panel - Right Side */}
            <div className="space-y-4">
              {/* File Upload */}
              <div className="border rounded-lg p-3">
                <h3 className="text-sm font-semibold mb-2 text-gray-700">
                  Upload Image
                </h3>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-800 file:mr-2 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
                />
                {selectedFile && (
                  <p className="text-xs text-gray-600 mt-1 truncate">
                    {selectedFile.name}
                  </p>
                )}
              </div>

              {/* Crop Tool */}
              {originalImage && (
                <div className="border rounded-lg p-3">
                  <h3 className="text-sm font-semibold mb-2 text-gray-700">
                    Crop Image
                  </h3>
                  <button
                    onClick={() => setShowCropTool(!showCropTool)}
                    disabled={isProcessing}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded text-sm transition-colors"
                  >
                    {showCropTool ? "Cancel Crop" : "Open Crop Tool"}
                  </button>
                  <div className="mt-2 text-xs text-gray-600">
                    <p>
                      Current size: {settings.crop.width}x{settings.crop.height}{" "}
                      px
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
                </div>
              )}

              {/* Transform Controls */}
              {originalImage && (
                <div className="border rounded-lg p-3">
                  <h3 className="text-sm font-semibold mb-2 text-gray-700">
                    Transform
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Rotation: {settings.rotation.toFixed(2)}°
                      </label>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        step="0.25"
                        value={settings.rotation}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            rotation: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>-180°</span>
                        <button
                          onClick={() =>
                            setSettings((prev) => ({ ...prev, rotation: 0 }))
                          }
                          className="text-blue-600 hover:underline"
                        >
                          Reset
                        </button>
                        <span>180°</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Skew X: {settings.skewX.toFixed(2)}°
                      </label>
                      <input
                        type="range"
                        min="-45"
                        max="45"
                        step="0.25"
                        value={settings.skewX}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            skewX: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>-45°</span>
                        <button
                          onClick={() =>
                            setSettings((prev) => ({ ...prev, skewX: 0 }))
                          }
                          className="text-blue-600 hover:underline"
                        >
                          Reset
                        </button>
                        <span>45°</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Skew Y: {settings.skewY.toFixed(2)}°
                      </label>
                      <input
                        type="range"
                        min="-45"
                        max="45"
                        step="0.25"
                        value={settings.skewY}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            skewY: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>-45°</span>
                        <button
                          onClick={() =>
                            setSettings((prev) => ({ ...prev, skewY: 0 }))
                          }
                          className="text-blue-600 hover:underline"
                        >
                          Reset
                        </button>
                        <span>45°</span>
                      </div>
                    </div>

                    {(settings.rotation !== 0 ||
                      settings.skewX !== 0 ||
                      settings.skewY !== 0) && (
                      <button
                        onClick={() =>
                          setSettings((prev) => ({
                            ...prev,
                            rotation: 0,
                            skewX: 0,
                            skewY: 0,
                          }))
                        }
                        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-1 px-3 rounded text-xs transition-colors"
                      >
                        Reset All Transforms
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Seamless Texture Settings */}
              <div className="border rounded-lg p-3">
                <h3 className="text-sm font-semibold mb-2 text-gray-700">
                  Seamless Texture
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Method:
                    </label>
                    <select
                      value={settings.method}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          method: e.target.value as any,
                        }))
                      }
                      className="w-full p-2 text-sm text-gray-800 border border-gray-400 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="none">None (plain tiling)</option>
                      <option value="method1">No.1 (simple blend)</option>
                      <option value="method2">No.2 (offset blend)</option>
                      <option value="method3">No.3 (gradient blend)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {settings.method === "none"
                        ? "No edge processing - shows raw seams"
                        : "Blends edges to create seamless texture"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Tile Format:
                    </label>
                    <select
                      value={settings.tileFormat}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          tileFormat: e.target.value as any,
                        }))
                      }
                      className="w-full p-2 text-sm text-gray-800 border border-gray-400 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="1x1">1x1</option>
                      <option value="2x2">2x2</option>
                      <option value="3x3">3x3</option>
                      <option value="4x4">4x4</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Mark Seams:
                    </label>
                    <select
                      value={settings.markSeams}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          markSeams: e.target.value as any,
                        }))
                      }
                      className="w-full p-2 text-sm text-gray-800 border border-gray-400 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="disabled">Disabled</option>
                      <option value="enabled">Enabled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Additional Settings */}
              <div className="border rounded-lg p-3">
                <h3 className="text-sm font-semibold mb-2 text-gray-700">
                  Additional Settings
                </h3>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-xs font-medium text-gray-600">
                        Edge Trim (removes pixels):
                      </h4>
                      <button
                        onClick={() => setPreCropLocked(!preCropLocked)}
                        className={`px-2 py-0.5 text-xs rounded ${
                          preCropLocked
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700"
                        }`}
                        title={
                          preCropLocked
                            ? "Locked: all sides equal"
                            : "Unlocked: adjust sides independently"
                        }
                      >
                        {preCropLocked ? "🔒 Locked" : "🔓 Free"}
                      </button>
                    </div>
                    {preCropLocked ? (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          All sides:
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={settings.preCrop.left}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            setSettings((prev) => ({
                              ...prev,
                              preCrop: {
                                left: value,
                                top: value,
                                bottom: value,
                                right: value,
                              },
                            }));
                          }}
                          className="w-full p-2 border border-gray-400 rounded text-sm text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-1">
                        <div>
                          <label className="block text-xs text-gray-500">
                            Left:
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={settings.preCrop.left}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                preCrop: {
                                  ...prev.preCrop,
                                  left: parseInt(e.target.value) || 0,
                                },
                              }))
                            }
                            className="w-full p-2 border border-gray-400 rounded text-sm text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">
                            Top:
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={settings.preCrop.top}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                preCrop: {
                                  ...prev.preCrop,
                                  top: parseInt(e.target.value) || 0,
                                },
                              }))
                            }
                            className="w-full p-2 border border-gray-400 rounded text-sm text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">
                            Bottom:
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={settings.preCrop.bottom}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                preCrop: {
                                  ...prev.preCrop,
                                  bottom: parseInt(e.target.value) || 0,
                                },
                              }))
                            }
                            className="w-full p-2 border border-gray-400 rounded text-sm text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500">
                            Right:
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={settings.preCrop.right}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                preCrop: {
                                  ...prev.preCrop,
                                  right: parseInt(e.target.value) || 0,
                                },
                              }))
                            }
                            className="w-full p-2 border border-gray-400 rounded text-sm text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}
                    {originalImage && settings.crop && (
                      <div className="mt-2 text-xs text-gray-500">
                        <p>
                          After trim:{" "}
                          {settings.crop.width -
                            settings.preCrop.left -
                            settings.preCrop.right}
                          x
                          {settings.crop.height -
                            settings.preCrop.top -
                            settings.preCrop.bottom}{" "}
                          px
                        </p>
                        {preCropLocked && (
                          <p className="text-blue-600 mt-0.5">
                            ✓ Aspect ratio preserved
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-medium text-gray-600 mb-1">
                      Pre-averaging:
                    </h4>
                    <div className="space-y-1">
                      <div>
                        <label className="block text-xs text-gray-500">
                          Intensity (0-100):
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={settings.preAveraging.intensity}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              preAveraging: {
                                ...prev.preAveraging,
                                intensity: parseInt(e.target.value) || 0,
                              },
                            }))
                          }
                          className="w-full p-1 border border-gray-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">
                          Radius (1-20):
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={settings.preAveraging.radius}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              preAveraging: {
                                ...prev.preAveraging,
                                radius: parseInt(e.target.value) || 5,
                              },
                            }))
                          }
                          className="w-full p-1 border border-gray-300 rounded text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Output Format */}
              <div className="border rounded-lg p-3">
                <h3 className="text-sm font-semibold mb-2 text-gray-700">
                  Output Format
                </h3>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="jpeg"
                      name="outputFormat"
                      value="jpeg"
                      checked={settings.outputFormat === "jpeg"}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          outputFormat: e.target.value as "jpeg",
                        }))
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="jpeg"
                      className="text-xs font-medium text-gray-700"
                    >
                      JPEG
                    </label>
                    {settings.outputFormat === "jpeg" && (
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={settings.jpegQuality}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              jpegQuality: parseInt(e.target.value) || 92,
                            }))
                          }
                          className="w-12 p-1 border border-gray-300 rounded text-xs"
                        />
                        <span className="text-xs text-gray-500">%</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="png"
                      name="outputFormat"
                      value="png"
                      checked={settings.outputFormat === "png"}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          outputFormat: e.target.value as "png",
                        }))
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="png"
                      className="text-xs font-medium text-gray-700"
                    >
                      PNG-24
                    </label>
                  </div>
                </div>
              </div>

              {/* Process Button */}
              <div className="text-center">
                <button
                  onClick={processImage}
                  disabled={!originalImage || isProcessing}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded text-sm transition-colors w-full"
                >
                  {isProcessing ? "Processing..." : "Reprocess Image"}
                </button>
                {isProcessing && (
                  <p className="text-xs text-gray-500 mt-1">
                    Processing usually lasts for 5-40 seconds
                  </p>
                )}
              </div>
            </div>
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
