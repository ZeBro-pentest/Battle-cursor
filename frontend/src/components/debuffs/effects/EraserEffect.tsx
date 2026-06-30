import { useEffect, useRef } from "react";
import type React from "react";

export function EraserEffect({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  const circleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let rafId: number;
    let x = Math.random() * canvas.offsetWidth;
    let y = Math.random() * canvas.offsetHeight;
    let vx = (Math.random() - 0.5) * 4;
    let vy = (Math.random() - 0.5) * 4;

    const tick = () => {
      x += vx;
      y += vy;
      if (x < 0 || x > canvas.offsetWidth)  vx *= -1;
      if (y < 0 || y > canvas.offsetHeight) vy *= -1;
      if (circleRef.current) {
        circleRef.current.style.left = `${x}px`;
        circleRef.current.style.top  = `${y}px`;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [canvasRef]);

  return (
    <div className="effect-eraser-overlay">
      <div ref={circleRef} className="effect-eraser-circle">✕</div>
    </div>
  );
}
