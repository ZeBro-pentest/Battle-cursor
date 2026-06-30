import { useEffect } from "react";
import type React from "react";

export function DvdEffect({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  useEffect(() => {
    const wrapper = canvasRef.current?.parentElement as HTMLElement | null;
    if (!wrapper) return;

    let x = 0, y = 0, vx = 2, vy = 1.4;
    const maxX = 90, maxY = 60;
    let rafId: number;

    const animate = () => {
      x += vx;
      y += vy;
      if (x >= maxX || x <= -maxX) vx *= -1;
      if (y >= maxY || y <= -maxY) vy *= -1;
      x = Math.max(-maxX, Math.min(maxX, x));
      y = Math.max(-maxY, Math.min(maxY, y));
      wrapper.style.transform = `translate(${x}px, ${y}px)`;
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(rafId);
      wrapper.style.transform = "";
    };
  }, [canvasRef]);

  return null;
}
