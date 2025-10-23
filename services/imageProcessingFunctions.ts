import { ImageTilerSettings } from "../types";

/**
 * Pure image processing functions that can be used in both main thread and web workers
 * These functions only manipulate pixel data and don't use DOM APIs
 */

export function applyPreCrop(
  imageData: ImageData,
  crop: ImageTilerSettings["preCrop"]
): ImageData {
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
}

export function applyPreAveraging(
  imageData: ImageData,
  intensity: number,
  radius: number
): ImageData {
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
}

export function applySeamlessTexture(
  imageData: ImageData,
  method: string,
  colorHarmonization?: {
    intensity: number;
    radius: number;
    blendArea: number;
  }
): ImageData {
  const { data, width, height } = imageData;
  const newData = new Uint8ClampedArray(data);

  switch (method) {
    case "none":
      // No processing - return original image data
      return imageData;

    case "method1":
      // Simple seam blending on tiled pattern
      const blendArea = 20; // pixels from seam to blend

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;

          // Check if pixel is near seams in tiled pattern
          const tileWidth = width / 2;
          const tileHeight = height / 2;

          const distFromVerticalSeam = Math.min(
            Math.abs(x - tileWidth),
            Math.abs(x - (width - tileWidth))
          );
          const distFromHorizontalSeam = Math.min(
            Math.abs(y - tileHeight),
            Math.abs(y - (height - tileHeight))
          );

          const minDistFromSeam = Math.min(
            distFromVerticalSeam,
            distFromHorizontalSeam
          );

          if (minDistFromSeam < blendArea) {
            const blendFactor = minDistFromSeam / blendArea;

            // Find opposite pixel across the seam
            let oppositeX = x;
            let oppositeY = y;

            if (distFromVerticalSeam < distFromHorizontalSeam) {
              // Near vertical seam - blend horizontally
              if (x < tileWidth) {
                oppositeX = width - 1 - x;
              } else {
                oppositeX = width - 1 - x;
              }
            } else {
              // Near horizontal seam - blend vertically
              if (y < tileHeight) {
                oppositeY = height - 1 - y;
              } else {
                oppositeY = height - 1 - y;
              }
            }

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
      // Offset method - blend seams in tiled pattern
      const blendWidth = Math.floor(width * 0.1);
      const blendHeight = Math.floor(height * 0.1);
      const tileWidth2 = width / 2;
      const tileHeight2 = height / 2;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          let blendFactor = 1.0;
          let oppositeIdx = idx;

          // Check if near vertical seam (center of tiled pattern)
          const distFromVerticalSeam = Math.min(
            Math.abs(x - tileWidth2),
            Math.abs(x - (width - tileWidth2))
          );

          // Check if near horizontal seam (center of tiled pattern)
          const distFromHorizontalSeam = Math.min(
            Math.abs(y - tileHeight2),
            Math.abs(y - (height - tileHeight2))
          );

          // Blend near vertical seam
          if (distFromVerticalSeam < blendWidth) {
            blendFactor = distFromVerticalSeam / blendWidth;
            // Find opposite pixel across vertical seam
            if (x < tileWidth2) {
              const oppositeX = width - 1 - x;
              oppositeIdx = (y * width + oppositeX) * 4;
            } else {
              const oppositeX = width - 1 - x;
              oppositeIdx = (y * width + oppositeX) * 4;
            }
          }
          // Blend near horizontal seam
          else if (distFromHorizontalSeam < blendHeight) {
            blendFactor = distFromHorizontalSeam / blendHeight;
            // Find opposite pixel across horizontal seam
            if (y < tileHeight2) {
              const oppositeY = height - 1 - y;
              oppositeIdx = (oppositeY * width + x) * 4;
            } else {
              const oppositeY = height - 1 - y;
              oppositeIdx = (oppositeY * width + x) * 4;
            }
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
      // Advanced seamless blending using gradient-based approach on tiled pattern
      const tileWidth3 = width / 2;
      const tileHeight3 = height / 2;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;

          // Calculate distance from seams in tiled pattern
          const distFromVerticalSeam =
            Math.min(
              Math.abs(x - tileWidth3),
              Math.abs(x - (width - tileWidth3))
            ) / tileWidth3;
          const distFromHorizontalSeam =
            Math.min(
              Math.abs(y - tileHeight3),
              Math.abs(y - (height - tileHeight3))
            ) / tileHeight3;

          // Use a smooth gradient for blending
          const seamFactor = Math.min(
            distFromVerticalSeam,
            distFromHorizontalSeam
          );

          if (seamFactor < 0.15) {
            const blendFactor = seamFactor / 0.15;

            // Calculate opposite position across the nearest seam
            let oppositeX = x;
            let oppositeY = y;

            if (distFromVerticalSeam < distFromHorizontalSeam) {
              // Near vertical seam - mirror horizontally
              oppositeX = width - 1 - x;
            } else {
              // Near horizontal seam - mirror vertically
              oppositeY = height - 1 - y;
            }

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

    case "method4":
      // Color harmonization - edge-preserving smoothing on tiled pattern
      if (colorHarmonization) {
        const { intensity, radius, blendArea } = colorHarmonization;
        const intensityFactor = intensity / 100;
        // Ensure minimum blend area of at least 5 pixels for visibility
        const blendAreaPixels = Math.max(
          5,
          Math.floor(Math.min(width, height) * (blendArea / 100))
        );

        // Apply color harmonization to seam areas in the tiled pattern
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;

            // Check if this pixel is near a seam (where tiles meet)
            const tileWidth = width / 2; // Assuming 2x2 tiling
            const tileHeight = height / 2;

            const distFromVerticalSeam = Math.min(
              Math.abs(x - tileWidth),
              Math.abs(x - (width - tileWidth))
            );
            const distFromHorizontalSeam = Math.min(
              Math.abs(y - tileHeight),
              Math.abs(y - (height - tileHeight))
            );

            const minDistFromSeam = Math.min(
              distFromVerticalSeam,
              distFromHorizontalSeam
            );

            if (minDistFromSeam < blendAreaPixels) {
              const edgeFactor = minDistFromSeam / blendAreaPixels;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];

              let rSum = 0;
              let gSum = 0;
              let bSum = 0;
              let totalWeight = 0;

              // Sample neighbors within radius
              for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                  const nx = x + dx;
                  const ny = y + dy;

                  if (
                    nx >= 0 &&
                    nx < width &&
                    ny >= 0 &&
                    ny < height &&
                    !(dx === 0 && dy === 0)
                  ) {
                    const neighborIdx = (ny * width + nx) * 4;
                    const nr = data[neighborIdx];
                    const ng = data[neighborIdx + 1];
                    const nb = data[neighborIdx + 2];

                    // Calculate spatial weight (Gaussian-like)
                    const spatialDist = Math.sqrt(dx * dx + dy * dy);
                    const spatialWeight = Math.exp(
                      -(spatialDist * spatialDist) / (2 * radius * radius)
                    );

                    // Calculate color similarity weight
                    const colorDist = Math.sqrt(
                      (r - nr) * (r - nr) +
                        (g - ng) * (g - ng) +
                        (b - nb) * (b - nb)
                    );
                    const colorWeight = Math.exp(
                      -(colorDist * colorDist) / (50 * 50)
                    );

                    const weight = spatialWeight * colorWeight;

                    rSum += nr * weight;
                    gSum += ng * weight;
                    bSum += nb * weight;

                    totalWeight += weight;
                  }
                }
              }

              if (totalWeight > 0) {
                const avgR = rSum / totalWeight;
                const avgG = gSum / totalWeight;
                const avgB = bSum / totalWeight;

                // Apply harmonization with intensity and edge factors
                const blendStrength = intensityFactor * (1 - edgeFactor * 0.5);

                newData[idx] =
                  data[idx] * (1 - blendStrength) + avgR * blendStrength;
                newData[idx + 1] =
                  data[idx + 1] * (1 - blendStrength) + avgG * blendStrength;
                newData[idx + 2] =
                  data[idx + 2] * (1 - blendStrength) + avgB * blendStrength;
              }
            }
          }
        }
      }
      break;
  }

  return new ImageData(newData, width, height);
}

/**
 * Mirror ImageData horizontally and/or vertically
 */
function mirrorImageData(
  imageData: ImageData,
  horizontal: boolean,
  vertical: boolean
): ImageData {
  const { width, height, data } = imageData;

  if (!horizontal && !vertical) {
    return imageData;
  }

  const mirroredData = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sourceIdx = (y * width + x) * 4;

      const targetX = horizontal ? width - 1 - x : x;
      const targetY = vertical ? height - 1 - y : y;
      const targetIdx = (targetY * width + targetX) * 4;

      mirroredData[targetIdx] = data[sourceIdx];
      mirroredData[targetIdx + 1] = data[sourceIdx + 1];
      mirroredData[targetIdx + 2] = data[sourceIdx + 2];
      mirroredData[targetIdx + 3] = data[sourceIdx + 3];
    }
  }

  return new ImageData(mirroredData, width, height);
}

export function createTiledPattern(
  imageData: ImageData,
  tileFormat: string,
  markSeams: boolean,
  mirrorTiles: boolean
): ImageData {
  const { width: tileWidth, height: tileHeight } = imageData;
  const [rows, cols] = tileFormat.split("x").map(Number);

  // Create tiles array - either mirrored or all original
  const tiles = mirrorTiles
    ? [
        // Mirroring pattern for seamless kaleidoscope effect
        mirrorImageData(imageData, false, false), // top-left: original
        mirrorImageData(imageData, true, false), // top-right: horizontal flip
        mirrorImageData(imageData, false, true), // bottom-left: vertical flip
        mirrorImageData(imageData, true, true), // bottom-right: both flips
      ]
    : [
        // No mirroring - just repeat the same tile
        imageData,
        imageData,
        imageData,
        imageData,
      ];

  // Calculate pattern dimensions
  const patternWidth = tileWidth * cols;
  const patternHeight = tileHeight * rows;
  const patternData = new Uint8ClampedArray(patternWidth * patternHeight * 4);

  // Copy tiles
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const tileIndex = row * cols + col;
      const tile = tiles[tileIndex];
      const { width: srcWidth, height: srcHeight, data: srcData } = tile;

      for (let y = 0; y < srcHeight; y++) {
        for (let x = 0; x < srcWidth; x++) {
          const sourceIdx = (y * srcWidth + x) * 4;
          const targetX = col * tileWidth + x;
          const targetY = row * tileHeight + y;
          const targetIdx = (targetY * patternWidth + targetX) * 4;

          patternData[targetIdx] = srcData[sourceIdx];
          patternData[targetIdx + 1] = srcData[sourceIdx + 1];
          patternData[targetIdx + 2] = srcData[sourceIdx + 2];
          patternData[targetIdx + 3] = srcData[sourceIdx + 3];
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
}
