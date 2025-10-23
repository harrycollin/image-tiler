export interface ImageTilerSettings {
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
