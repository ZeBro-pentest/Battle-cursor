import type React from "react";

// Эффект применяется через getCanvasStyle (BlurEffect.tsx):
//   brightness(0.05) передаётся как filter на canvas-элемент в Game.tsx.
// Компонент возвращает null — визуальная часть обработана getCanvasStyle.
export function DarknessEffect(_props: { canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  return null;
}
