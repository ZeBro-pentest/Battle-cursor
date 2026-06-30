import { useEffect } from "react";
import type React from "react";

export function FreezeEffect({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.style.pointerEvents = "none";
    return () => {
      canvas.style.pointerEvents = "";
    };
  }, [canvasRef]);

  return null;
}
