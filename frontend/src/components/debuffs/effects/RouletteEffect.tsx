import { useState, useRef } from "react";

const OPTIONS = ["Доступ открыт!", "Ещё раз...", "Почти!", "Не повезло"];

export function RouletteEffect({ onComplete }: { onComplete: () => void }) {
  const [spinning, setSpinning] = useState(false);
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);

    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % OPTIONS.length);
    }, 100);

    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const win = Math.random() < 0.33;
      const picked = win ? OPTIONS[0] : OPTIONS[1 + Math.floor(Math.random() * 3)];
      setResult(picked);
      setSpinning(false);
      if (win) setTimeout(onComplete, 800);
    }, 2000);
  };

  const showBtn = !spinning && result !== "Доступ открыт!";

  return (
    <div className="effect-epic-overlay">
      <div className="effect-epic-box effect-roulette-box">
        <p className="effect-epic-title">🎡 Рулетка доступа</p>
        <p className="effect-epic-hint-text">Шанс 33% — крути пока не повезёт</p>
        <div className="effect-roulette-wheel">
          {result ? (
            <span
              className={`effect-roulette-result${result === "Доступ открыт!" ? " effect-roulette-result--win" : ""}`}
            >
              {result}
            </span>
          ) : (
            <span className="effect-roulette-spinning">{OPTIONS[current]}</span>
          )}
        </div>
        {showBtn && (
          <button className="effect-epic-btn" onClick={spin}>
            Крутить
          </button>
        )}
      </div>
    </div>
  );
}
