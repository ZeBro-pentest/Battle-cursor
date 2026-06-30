import { useState, useEffect, useRef } from "react";
import type React from "react";

const TOOLS = ["Кисть", "Ластик", "Заливка", "Очистить всё", "Мега кисть"];

export function WeaponsEffect({
  onComplete,
  canvasRef,
}: {
  onComplete: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}) {
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % TOOLS.length);
    }, 120);

    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const picked = TOOLS[Math.floor(Math.random() * TOOLS.length)];
      setResult(picked);
      if (picked === "Очистить всё") {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        }
      }
      setTimeout(onComplete, 1500);
    }, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="effect-epic-overlay">
      <div className="effect-epic-box effect-weapons-box">
        <p className="effect-epic-title">🎰 Рулетка инструментов</p>
        {result ? (
          <>
            <p className="effect-weapons-result">
              Выпало: <strong>{result}</strong>
            </p>
            <p className="effect-epic-hint-text">Применяется...</p>
          </>
        ) : (
          <div className="effect-weapons-slot">
            {TOOLS.map((t, i) => (
              <span
                key={t}
                className={`effect-weapons-item${i === current ? " effect-weapons-item--active" : ""}`}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
