"use client";
import dynamic from "next/dynamic";

const ImageTiler = dynamic(() => import("../components/ImageTiler"), {
  ssr: false,
});

export default function Home() {
  return <ImageTiler />;
}
