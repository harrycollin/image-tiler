import { useState, useCallback } from "react";
import { ImageTilerSettings } from "../types";

export interface UseImageUploadResult {
  selectedFile: File | null;
  originalImage: HTMLImageElement | null;
  initialCropSettings: ImageTilerSettings["crop"] | null;
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  clearImage: () => void;
}

export const useImageUpload = (): UseImageUploadResult => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(
    null
  );
  const [initialCropSettings, setInitialCropSettings] = useState<
    ImageTilerSettings["crop"] | null
  >(null);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setSelectedFile(file);

        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            setOriginalImage(img);
            setInitialCropSettings({
              x: 0,
              y: 0,
              width: img.width,
              height: img.height,
            });
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    },
    []
  );

  const clearImage = useCallback(() => {
    setSelectedFile(null);
    setOriginalImage(null);
    setInitialCropSettings(null);
  }, []);

  return {
    selectedFile,
    originalImage,
    initialCropSettings,
    handleFileSelect,
    clearImage,
  };
};
