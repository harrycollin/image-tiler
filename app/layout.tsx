import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "react-image-crop/dist/ReactCrop.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Visual Image Tiler - Create Seamless Textures Online",
  description:
    "Create seamless textures from uploaded images with real-time preview and customizable settings. Free online tool for generating tileable patterns for game development, web design, and graphics.",
  keywords: [
    "seamless texture",
    "tile generator",
    "texture creator",
    "image tiler",
    "tileable texture",
    "game textures",
    "pattern generator",
    "seamless pattern",
    "texture tool",
    "online image editor",
  ],
  authors: [{ name: "Image Tiler" }],
  creator: "Image Tiler",
  publisher: "Image Tiler",
  metadataBase: new URL("https://image-tiler.harrycollin.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Visual Image Tiler - Create Seamless Textures Online",
    description:
      "Create seamless textures from uploaded images with real-time preview and customizable settings. Free online tool for generating tileable patterns.",
    url: "https://image-tiler.harrycollin.com",
    siteName: "Visual Image Tiler",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/image-tiler/og-image.png",
        width: 1200,
        height: 630,
        alt: "Visual Image Tiler - Create Seamless Textures",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Visual Image Tiler - Create Seamless Textures Online",
    description:
      "Create seamless textures from uploaded images with real-time preview and customizable settings.",
    images: ["/image-tiler/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here when you get them
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // bing: "your-bing-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
