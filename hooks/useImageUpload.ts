import { useState, useCallback } from "react";
import { ImageTilerSettings } from "../types";

export interface ImageData {
  file: File;
  image: HTMLImageElement;
  crop: ImageTilerSettings["crop"];
}

export interface UseImageUploadResult {
  images: ImageData[];
  selectedImageIndex: number;
  selectedFile: File | null;
  originalImage: HTMLImageElement | null;
  initialCropSettings: ImageTilerSettings["crop"] | null;
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setSelectedImageIndex: (index: number) => void;
  updateCropForCurrentImage: (crop: ImageTilerSettings["crop"]) => void;
  updateCropForAllImages: (crop: ImageTilerSettings["crop"]) => void;
  clearImages: () => void;
}

export const useImageUpload = (): UseImageUploadResult => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);
      let loadedCount = 0;
      const newImages: ImageData[] = [];

      fileArray.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            newImages.push({
              file,
              image: img,
              crop: {
                x: 0,
                y: 0,
                width: img.width,
                height: img.height,
              },
            });
            loadedCount++;

            // Once all images are loaded, update state
            if (loadedCount === fileArray.length) {
              setImages(newImages);
              setSelectedImageIndex(0);
            }
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      });
    },
    []
  );

  const updateCropForCurrentImage = useCallback(
    (crop: ImageTilerSettings["crop"]) => {
      setImages((prevImages) => {
        const newImages = [...prevImages];
        if (newImages[selectedImageIndex]) {
          newImages[selectedImageIndex] = {
            ...newImages[selectedImageIndex],
            crop,
          };
        }
        return newImages;
      });
    },
    [selectedImageIndex]
  );

  const updateCropForAllImages = useCallback(
    (crop: ImageTilerSettings["crop"]) => {
      setImages((prevImages) => {
        return prevImages.map((imageData) => ({
          ...imageData,
          crop,
        }));
      });
    },
    []
  );

  const clearImages = useCallback(() => {
    setImages([]);
    setSelectedImageIndex(0);
  }, []);

  // Backward compatibility helpers
  const selectedFile = images[selectedImageIndex]?.file || null;
  const originalImage = images[selectedImageIndex]?.image || null;
  const initialCropSettings = images[selectedImageIndex]?.crop || null;

  return {
    images,
    selectedImageIndex,
    selectedFile,
    originalImage,
    initialCropSettings,
    handleFileSelect,
    setSelectedImageIndex,
    updateCropForCurrentImage,
    updateCropForAllImages,
    clearImages,
  };
};
