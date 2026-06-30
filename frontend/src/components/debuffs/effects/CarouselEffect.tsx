import { useEffect } from "react";
import type React from "react";

export function CarouselEffect({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  useEffect(() => {
    const wrapper = canvasRef.current?.parentElement as HTMLElement | null;
    if (!wrapper) return;
    wrapper.style.animation = "carousel-spin 4s linear infinite";
    return () => {
      wrapper.style.animation = "";
    };
  }, [canvasRef]);

  return null;
}
