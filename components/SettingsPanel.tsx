import React, { useState } from "react";
import { ImageTilerSettings } from "../types";
import { FileUpload } from "./FileUpload";
import { CropTool } from "./CropTool";

interface SettingsPanelProps {
  selectedFile: File | null;
  originalImage: HTMLImageElement | null;
  settings: ImageTilerSettings;
  isProcessing: boolean;
  showCropTool: boolean;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSettingsChange: (settings: ImageTilerSettings) => void;
  onCropToolToggle: () => void;
  onCropChange: (crop: ImageTilerSettings["crop"]) => void;
  onProcessImage: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  selectedFile,
  originalImage,
  settings,
  isProcessing,
  showCropTool,
  onFileSelect,
  onSettingsChange,
  onCropToolToggle,
  onCropChange,
  onProcessImage,
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
        <FileUpload selectedFile={selectedFile} onFileSelect={onFileSelect} />

        {/* Crop Tool */}
        {originalImage && !showCropTool && (
          <div className="border rounded-lg p-3">
            <h3 className="text-sm font-semibold mb-2 text-gray-700">
              Crop Image
            </h3>
            <button
              onClick={onCropToolToggle}
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded text-sm transition-colors"
            >
              Open Crop Tool
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
                  updateSettings({ method: e.target.value as any })
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
                  updateSettings({ tileFormat: e.target.value as any })
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
                  updateSettings({ markSeams: e.target.value as any })
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
  );
};
