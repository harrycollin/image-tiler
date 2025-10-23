import { ImageTilerSettings } from "../types";

export const applyTransform = (
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

export const applyPreCrop = (
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

export const applyPreAveraging = (
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

export const applySeamlessTexture = (
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
            const oppositeY = y < height / 2 ? height - 1 - y : y - height / 2;

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

export const createTiledPattern = (
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
