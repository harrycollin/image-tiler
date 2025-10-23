import React, { useState } from "react";
import { ImageTilerSettings } from "../types";
import { FileUpload } from "./FileUpload";
import { ImageData } from "../hooks/useImageUpload";

interface SettingsPanelProps {
  selectedFile: File | null;
  originalImage: HTMLImageElement | null;
  images: ImageData[];
  selectedImageIndex: number;
  settings: ImageTilerSettings;
  isProcessing: boolean;
  showCropTool: boolean;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onImageSelect: (index: number) => void;
  onSettingsChange: (settings: ImageTilerSettings) => void;
  onCropToolToggle: () => void;
  onProcessImage: () => void;
  onDownload: () => void;
  onDownloadAll: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  selectedFile,
  originalImage,
  images,
  selectedImageIndex,
  settings,
  isProcessing,
  showCropTool,
  onFileSelect,
  onImageSelect,
  onSettingsChange,
  onCropToolToggle,
  onProcessImage,
  onDownload,
  onDownloadAll,
}) => {
  const [preCropLocked, setPreCropLocked] = useState(true);

  const updateSettings = (updates: Partial<ImageTilerSettings>) => {
    onSettingsChange({ ...settings, ...updates });
  };

  return (
    <div className="w-80 flex-shrink-0">
      <div
        className="h-full overflow-y-auto space-y-4 pr-2 pb-4"
        style={{ scrollbarWidth: "thin" }}
      >
        {/* File Upload */}
        <FileUpload
          selectedFile={selectedFile}
          fileCount={images.length}
          onFileSelect={onFileSelect}
        />

        {/* Image Selector */}
        {images.length > 1 && (
          <div className="border rounded-lg p-3">
            <h3 className="text-sm font-semibold mb-2 text-gray-700">
              Select Image to Preview
            </h3>
            <select
              value={selectedImageIndex}
              onChange={(e) => onImageSelect(parseInt(e.target.value))}
              className="w-full p-2 text-sm text-gray-800 border border-gray-400 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {images.map((imageData, index) => (
                <option key={index} value={index}>
                  {imageData.file.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Previewing: {images[selectedImageIndex]?.file.name}
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              Settings apply to all {images.length} images
            </p>
          </div>
        )}

        {/* Crop Tool */}
        {originalImage && !showCropTool && (
          <div className="border rounded-lg p-3">
            <h3 className="text-sm font-semibold mb-2 text-gray-700">
              Crop Image{images.length > 1 ? "s" : ""}
            </h3>
            <button
              onClick={onCropToolToggle}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded text-sm transition-colors"
            >
              Open Crop Tool
            </button>
            <div className="mt-2 text-xs text-gray-600">
              <p>
                Current size: {settings.crop.width}x{settings.crop.height} px
              </p>
              {settings.crop.width !== originalImage.width ||
              settings.crop.height !== originalImage.height ? (
                <>
                  <p className="text-blue-600 font-medium mt-1">
                    ✓ Custom crop applied
                  </p>
                  {images.length > 1 && (
                    <p className="text-blue-600 text-xs mt-0.5">
                      (applies to all images)
                    </p>
                  )}
                </>
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
                    updateSettings({ rotation: parseFloat(e.target.value) })
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>-180°</span>
                  <button
                    onClick={() => updateSettings({ rotation: 0 })}
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
                    updateSettings({ skewX: parseFloat(e.target.value) })
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>-45°</span>
                  <button
                    onClick={() => updateSettings({ skewX: 0 })}
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
                    updateSettings({ skewY: parseFloat(e.target.value) })
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>-45°</span>
                  <button
                    onClick={() => updateSettings({ skewY: 0 })}
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
                    updateSettings({
                      rotation: 0,
                      skewX: 0,
                      skewY: 0,
                    })
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
                  updateSettings({
                    method: e.target.value as ImageTilerSettings["method"],
                  })
                }
                className="w-full p-2 text-sm text-gray-800 border border-gray-400 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="none">None (plain tiling)</option>
                <option value="method1">No.1 (simple blend)</option>
                <option value="method2">No.2 (offset blend)</option>
                <option value="method3">No.3 (gradient blend)</option>
                <option value="method4">No.4 (color harmonization)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {settings.method === "none"
                  ? "No edge processing - shows raw seams"
                  : settings.method === "method4"
                  ? "Reduces color distance between neighboring pixels"
                  : "Blends edges to create seamless texture"}
              </p>
            </div>

            {/* Color Harmonization Controls */}
            {settings.method === "method4" && (
              <div className="space-y-3 border-t pt-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Intensity: {settings.colorHarmonization.intensity}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={settings.colorHarmonization.intensity}
                    onChange={(e) =>
                      updateSettings({
                        colorHarmonization: {
                          ...settings.colorHarmonization,
                          intensity: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Radius: {settings.colorHarmonization.radius}px
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={settings.colorHarmonization.radius}
                    onChange={(e) =>
                      updateSettings({
                        colorHarmonization: {
                          ...settings.colorHarmonization,
                          radius: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1px</span>
                    <span>10px</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Blend Area: {settings.colorHarmonization.blendArea}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={settings.colorHarmonization.blendArea}
                    onChange={(e) =>
                      updateSettings({
                        colorHarmonization: {
                          ...settings.colorHarmonization,
                          blendArea: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>50%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Percentage of edge area to harmonize
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Mark Seams:
              </label>
              <select
                value={settings.markSeams}
                onChange={(e) =>
                  updateSettings({
                    markSeams: e.target
                      .value as ImageTilerSettings["markSeams"],
                  })
                }
                className="w-full p-2 text-sm text-gray-800 border border-gray-400 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="disabled">Disabled</option>
                <option value="enabled">Enabled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Mirror Tiles:
              </label>
              <select
                value={settings.mirrorTiles ? "enabled" : "disabled"}
                onChange={(e) =>
                  updateSettings({
                    mirrorTiles: e.target.value === "enabled",
                  })
                }
                className="w-full p-2 text-sm text-gray-800 border border-gray-400 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="disabled">Disabled</option>
                <option value="enabled">Enabled (kaleidoscope)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {settings.mirrorTiles
                  ? "Tiles are mirrored for seamless kaleidoscope effect"
                  : "Tiles repeat without mirroring"}
              </p>
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
                      updateSettings({
                        preCrop: {
                          left: value,
                          top: value,
                          bottom: value,
                          right: value,
                        },
                      });
                    }}
                    className="w-full p-2 border border-gray-400 rounded text-sm text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <label className="block text-xs text-gray-500">Left:</label>
                    <input
                      type="number"
                      min="0"
                      value={settings.preCrop.left}
                      onChange={(e) =>
                        updateSettings({
                          preCrop: {
                            ...settings.preCrop,
                            left: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full p-2 border border-gray-400 rounded text-sm text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Top:</label>
                    <input
                      type="number"
                      min="0"
                      value={settings.preCrop.top}
                      onChange={(e) =>
                        updateSettings({
                          preCrop: {
                            ...settings.preCrop,
                            top: parseInt(e.target.value) || 0,
                          },
                        })
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
                        updateSettings({
                          preCrop: {
                            ...settings.preCrop,
                            bottom: parseInt(e.target.value) || 0,
                          },
                        })
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
                        updateSettings({
                          preCrop: {
                            ...settings.preCrop,
                            right: parseInt(e.target.value) || 0,
                          },
                        })
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
                      updateSettings({
                        preAveraging: {
                          ...settings.preAveraging,
                          intensity: parseInt(e.target.value) || 0,
                        },
                      })
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
                      updateSettings({
                        preAveraging: {
                          ...settings.preAveraging,
                          radius: parseInt(e.target.value) || 5,
                        },
                      })
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
                  updateSettings({ outputFormat: e.target.value as "jpeg" })
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
                      updateSettings({
                        jpegQuality: parseInt(e.target.value) || 92,
                      })
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
                  updateSettings({ outputFormat: e.target.value as "png" })
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
            onClick={onProcessImage}
            disabled={!originalImage}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded text-sm transition-colors w-full flex items-center justify-center gap-2"
          >
            {isProcessing && (
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            <span>{isProcessing ? "Processing..." : "Reprocess Image"}</span>
          </button>
          <p className="text-xs text-gray-500 mt-1">
            Auto-processes on settings change
          </p>
        </div>

        {/* Download Button */}
        <div className="text-center space-y-2">
          {images.length > 1 ? (
            <>
              <button
                onClick={onDownloadAll}
                disabled={!originalImage || isProcessing}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded text-sm transition-colors w-full flex items-center justify-center gap-2"
              >
                {isProcessing && (
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                <span>
                  {isProcessing
                    ? "Processing..."
                    : `Download All (${images.length})`}
                </span>
              </button>
              <p className="text-xs text-gray-500">
                Processes and downloads all {images.length} images with current
                settings
              </p>
            </>
          ) : (
            <>
              <button
                onClick={onDownload}
                disabled={!originalImage}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded text-sm transition-colors w-full"
              >
                Download Result
              </button>
              <p className="text-xs text-gray-500">
                Downloads the tiled pattern as{" "}
                {settings.outputFormat.toUpperCase()}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
