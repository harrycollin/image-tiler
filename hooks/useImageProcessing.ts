import { useState, useCallback, useRef } from "react";
import { ImageTilerSettings } from "../types";
import {
  ImageProcessor,
  ProcessedImageResult,
} from "../services/ImageProcessor";

export interface UseImageProcessingResult {
  isProcessing: boolean;
  processedResult: ProcessedImageResult | null;
  processImage: (
    originalImage: HTMLImageElement,
    settings: ImageTilerSettings
  ) => Promise<void>;
  downloadProcessedImage: (settings: ImageTilerSettings) => void;
  clearProcessedResult: () => void;
}

export const useImageProcessing = (): UseImageProcessingResult => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedResult, setProcessedResult] =
    useState<ProcessedImageResult | null>(null);
  const imageProcessor = useRef(ImageProcessor.getInstance());

  const processImage = useCallback(
    async (originalImage: HTMLImageElement, settings: ImageTilerSettings) => {
      setIsProcessing(true);

      try {
        // Process new image first
        const result = await imageProcessor.current.processImage(
          originalImage,
          settings
        );

        // Then clean up old result and set new one
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
        setIsProcessing(false);
      }
    },
    []
  );

  const downloadProcessedImage = useCallback(
    (settings: ImageTilerSettings) => {
      if (!processedResult) return;

      const link = document.createElement("a");
      link.href = processedResult.downloadUrl;
      link.download = `seamless-texture-${settings.tileFormat}.${settings.outputFormat}`;
      link.click();
    },
    [processedResult]
  );

  const clearProcessedResult = useCallback(() => {
    if (processedResult?.downloadUrl) {
      imageProcessor.current.revokeDownloadUrl(processedResult.downloadUrl);
    }
    setProcessedResult(null);
  }, [processedResult?.downloadUrl]);

  return {
    isProcessing,
    processedResult,
    processImage,
    downloadProcessedImage,
    clearProcessedResult,
  };
};
