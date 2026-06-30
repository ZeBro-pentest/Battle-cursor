import { useState, useEffect } from "react";

const MESSAGES = ["Сканирование...", "Проверка файлов...", "Анализ угроз...", "Завершение..."];

export function ScanEffect({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const msgIndex = Math.min(Math.floor(progress / 25), 3);

  useEffect(() => {
    const start = Date.now();
    const duration = 5000;
    let rafId: number;

    const tick = () => {
      const pct = Math.min(((Date.now() - start) / duration) * 100, 100);
      setProgress(pct);
      if (pct < 100) {
        rafId = requestAnimationFrame(tick);
      } else {
        setTimeout(onComplete, 300);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [onComplete]);

  return (
    <div className="effect-epic-overlay">
      <div className="effect-epic-box">
        <p className="effect-epic-title">Проверка безопасности</p>
        <p className="effect-epic-text">{MESSAGES[msgIndex]}</p>
        <div className="effect-scan-bar-wrap">
          <div className="effect-scan-bar" style={{ width: `${progress}%` }} />
        </div>
        <p className="effect-epic-hint-text">{Math.floor(progress)}%</p>
      </div>
    </div>
  );
}
