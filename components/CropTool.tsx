import React, { useState, useRef } from "react";
import ReactCrop, {
  type Crop,
  PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
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
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  // Convert our crop format to react-image-crop format
  const convertToReactCrop = (
    crop: ImageTilerSettings["crop"],
    imageWidth: number,
    imageHeight: number
  ): Crop => {
    return {
      x: (crop.x / imageWidth) * 100,
      y: (crop.y / imageHeight) * 100,
      width: (crop.width / imageWidth) * 100,
      height: (crop.height / imageHeight) * 100,
      unit: "px",
    };
  };

  // Convert react-image-crop format to our crop format
  const convertFromReactCrop = (
    crop: PixelCrop
  ): ImageTilerSettings["crop"] => {
    return {
      x: Math.round(crop.x),
      y: Math.round(crop.y),
      width: Math.round(crop.width),
      height: Math.round(crop.height),
    };
  };

  // Initialize crop when component mounts or image changes
  React.useEffect(() => {
    if (originalImage && !crop) {
      const initialCrop = convertToReactCrop(
        settings.crop,
        originalImage.width,
        originalImage.height
      );
      setCrop(initialCrop);
    }
  }, [originalImage, settings.crop, crop]);

  const onCropChangeHandler = (crop: Crop) => {
    setCrop(crop);
  };

  const onCropComplete = (crop: PixelCrop) => {
    setCompletedCrop(crop);
    const newCrop = convertFromReactCrop(crop);
    onCropChange(newCrop);
  };

  const resetCrop = () => {
    if (originalImage) {
      const fullCrop = convertToReactCrop(
        {
          x: 0,
          y: 0,
          width: originalImage.width,
          height: originalImage.height,
        },
        originalImage.width,
        originalImage.height
      );
      setCrop(fullCrop);
      onCropChange({
        x: 0,
        y: 0,
        width: originalImage.width,
        height: originalImage.height,
      });
    }
  };

  const applyCrop = () => {
    if (completedCrop) {
      const finalCrop = convertFromReactCrop(completedCrop);
      onCropChange(finalCrop);
      onClose();
    }
  };

  if (!originalImage) return null;

  // Create image URL from the original image
  const imageUrl = React.useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(originalImage, 0, 0);
    }
    return canvas.toDataURL();
  }, [originalImage]);

  return (
    <div className="border rounded-lg p-3 h-full flex flex-col">
      <h3 className="text-sm font-semibold mb-2 text-gray-700">Crop Image</h3>

      {/* Crop Controls */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-gray-600">Crop Controls</label>
          <div className="flex gap-2">
            <button
              onClick={resetCrop}
              className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Reset
            </button>
            <button
              onClick={applyCrop}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Apply
            </button>
            <button
              onClick={onClose}
              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Crop Info */}
      <div className="mb-3 text-xs text-gray-600">
        <p>
          Current size: {Math.round(settings.crop.width)}x
          {Math.round(settings.crop.height)} px
        </p>
        <p>
          Aspect ratio:{" "}
          {(settings.crop.width / settings.crop.height).toFixed(2)}:1
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

      {/* React Image Crop */}
      <div className="mt-4 flex-1 flex items-center justify-center">
        <div className="relative w-full h-full flex items-center justify-center">
          <ReactCrop
            crop={crop}
            onChange={onCropChangeHandler}
            onComplete={onCropComplete}
            aspect={undefined}
            minWidth={50}
            minHeight={50}
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Crop me"
              className="max-w-full max-h-full object-contain"
            />
          </ReactCrop>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600 mb-2">
          Drag corners to resize • Drag center to move
        </p>
      </div>
    </div>
  );
};
