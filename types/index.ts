export interface ImageTilerSettings {
  method: "none" | "method1" | "method2" | "method3" | "method4";
  tileFormat: "2x2"; // Only 2x2 supported with mirroring
  markSeams: "enabled" | "disabled";
  mirrorTiles: boolean; // Mirror tiles to create kaleidoscope effect
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
  colorHarmonization: {
    intensity: number; // 0-100, controls blend strength
    radius: number; // 1-10 pixels, neighborhood size
    blendArea: number; // 0-50%, percentage of edge area to affect
  };
  outputFormat: "jpeg" | "png";
  jpegQuality: number;
}
