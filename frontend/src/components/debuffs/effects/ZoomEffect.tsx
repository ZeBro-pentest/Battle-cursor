import { useEffect } from "react";
import type React from "react";

export function ZoomEffect({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  useEffect(() => {
    const wrapper = canvasRef.current?.parentElement as HTMLElement | null;
    if (!wrapper) return;
    wrapper.classList.add("effect-zoom-active");
    return () => {
      wrapper.classList.remove("effect-zoom-active");
    };
  }, [canvasRef]);

  return null;
}
