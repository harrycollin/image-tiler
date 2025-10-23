# Visual Image Tiler

Create seamless textures from uploaded images with real-time preview and customizable settings. A free online tool for generating tileable patterns perfect for game development, web design, and graphics work.

**Live Demo**: [https://image-tiler.harrycollin.com/](https://image-tiler.harrycollin.com/)

## Features

- **Multiple Seamless Methods**: Choose from various edge-blending algorithms
- **Real-time Preview**: See changes instantly with live 2x2, 3x3, or 4x4 tile previews
- **Crop Tool**: Select specific areas of your image to process
- **Transform Options**: Rotate and skew your textures
- **Edge Trimming**: Remove unwanted edge pixels
- **Pre-averaging**: Smooth out textures with blur effects
- **Export Options**: Download as JPEG or PNG with quality control
- **Seam Visualization**: Toggle red lines to check tile boundaries

## Getting Started

### Prerequisites

- Node.js 20+ 
- pnpm (or npm/yarn)

### Installation

```bash
# Clone the repository
git clone https://github.com/harrycollin/image-tiler.git
cd image-tiler

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Building for Production

```bash
# Create optimized production build
pnpm build

# Static files will be in the 'out' directory
```

## How to Use

1. **Upload Image**: Click "Upload Image" and select your texture
2. **Choose Method**: Select seamless texture method (None, Method 1, 2, or 3)
3. **Adjust Settings**: Use crop, rotation, trim, and other tools to perfect your texture
4. **Preview**: View the tiled result in real-time
5. **Download**: Export your seamless texture in JPEG or PNG format

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

This project is open source and available under the MIT License.

## Contact

GitHub: [@harrycollin](https://github.com/harrycollin)
