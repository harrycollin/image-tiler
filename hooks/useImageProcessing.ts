import { useState, useRef } from "react";
import { ImageTilerSettings } from "../types";
import {
  ImageProcessor,
  ProcessedImageResult,
} from "../services/ImageProcessor";
import { ImageData } from "./useImageUpload";

export interface UseImageProcessingResult {
  isProcessing: boolean;
  processedResult: ProcessedImageResult | null;
  processImage: (
    originalImage: HTMLImageElement,
    settings: ImageTilerSettings
  ) => Promise<void>;
  downloadProcessedImage: (settings: ImageTilerSettings) => void;
  downloadAllImages: (
    images: ImageData[],
    settings: ImageTilerSettings
  ) => Promise<void>;
  clearProcessedResult: () => void;
}

export const useImageProcessing = (): UseImageProcessingResult => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedResult, setProcessedResult] =
    useState<ProcessedImageResult | null>(null);
  const imageProcessor = useRef(ImageProcessor.getInstance());
  const currentRequestId = useRef(0);
  const pendingRequest = useRef<{
    image: HTMLImageElement;
    settings: ImageTilerSettings;
  } | null>(null);
  const isProcessingRef = useRef(false);

  const processImage = async (
    originalImage: HTMLImageElement,
    settings: ImageTilerSettings
  ) => {
    const requestId = ++currentRequestId.current;

    // If already processing, queue this request as the latest
    if (isProcessingRef.current) {
      pendingRequest.current = { image: originalImage, settings };
      return;
    }

    isProcessingRef.current = true;
    setIsProcessing(true);

    try {
      // Process new image
      const result = await imageProcessor.current.processImage(
        originalImage,
        settings
      );

      // Check if this request is still valid (not superseded)
      if (requestId !== currentRequestId.current) {
        // A newer request came in, discard this result
        imageProcessor.current.revokeDownloadUrl(result.downloadUrl);
        return;
      }

      // Clean up old result and set new one
      setProcessedResult((prevResult) => {
        if (prevResult?.downloadUrl) {
          imageProcessor.current.revokeDownloadUrl(prevResult.downloadUrl);
        }
        return result;
      });
    } catch (error) {
      console.error("Error processing image:", error);
      throw error;
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);

      // Process any pending request with latest settings
      if (pendingRequest.current) {
        const pending = pendingRequest.current;
        pendingRequest.current = null;
        // Use setTimeout to avoid immediate recursion
        setTimeout(() => processImage(pending.image, pending.settings), 0);
      }
    }
  };

  const downloadProcessedImage = (settings: ImageTilerSettings) => {
    if (!processedResult) return;

    const link = document.createElement("a");
    link.href = processedResult.downloadUrl;
    link.download = `seamless-texture.${settings.outputFormat}`;
    link.click();
  };

  const downloadAllImages = async (
    images: ImageData[],
    settings: ImageTilerSettings
  ) => {
    if (images.length === 0) return;

    setIsProcessing(true);

    try {
      for (let i = 0; i < images.length; i++) {
        const imageData = images[i];

        // Apply per-image crop to settings
        const imageSettings = {
          ...settings,
          crop: imageData.crop,
        };

        // Process the image
        const result = await imageProcessor.current.processImage(
          imageData.image,
          imageSettings
        );

        // Extract filename without extension
        const fileName = imageData.file.name.replace(/\.[^/.]+$/, "");

        // Download the result
        const link = document.createElement("a");
        link.href = result.downloadUrl;
        link.download = `seamless-texture-${fileName}-${settings.tileFormat}.${settings.outputFormat}`;
        link.click();

        // Clean up the blob URL after download
        await new Promise((resolve) => setTimeout(resolve, 100));
        imageProcessor.current.revokeDownloadUrl(result.downloadUrl);
      }
    } catch (error) {
      console.error("Error downloading images:", error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const clearProcessedResult = () => {
    if (processedResult?.downloadUrl) {
      imageProcessor.current.revokeDownloadUrl(processedResult.downloadUrl);
    }
    setProcessedResult(null);
  };

  return {
    isProcessing,
    processedResult,
    processImage,
    downloadProcessedImage,
    downloadAllImages,
    clearProcessedResult,
  };
};
