import { useState, useEffect, useRef } from "react";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const genCode = () => {
  const len = 4 + Math.floor(Math.random() * 3);
  return Array.from({ length: len }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");
};

export function CodeEffect({ onComplete }: { onComplete: () => void }) {
  const [code] = useState(genCode);
  const [visible, setVisible] = useState(true);
  const [value, setValue] = useState("");
  const [hints, setHints] = useState(3);
  const [showHint, setShowHint] = useState(false);
  const [error, setError] = useState(false);
  const rafRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    rafRef.current = setTimeout(() => setVisible(false), 2000);
    return () => { if (rafRef.current) clearTimeout(rafRef.current); };
  }, []);

  const showAgain = () => {
    if (hints <= 0 || showHint) return;
    setHints((h) => h - 1);
    setShowHint(true);
    setTimeout(() => setShowHint(false), 1000);
  };

  const check = () => {
    if (value.toUpperCase().trim() === code) {
      onComplete();
    } else {
      setError(true);
      setValue("");
      setTimeout(() => setError(false), 1200);
    }
  };

  return (
    <div className="effect-epic-overlay">
      <div className="effect-epic-box">
        <p className="effect-epic-title">Запомни код</p>
        {visible || showHint ? (
          <div className="effect-code-display">{code}</div>
        ) : (
          <>
            <input
              className={`effect-epic-input${error ? " effect-epic-input--error" : ""}`}
              value={value}
              onChange={(e) => setValue(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === "Enter") check(); }}
              placeholder="Введи код..."
              autoFocus
            />
            {error && <p className="effect-epic-error">Неверно!</p>}
            <div className="effect-epic-row">
              <button className="effect-epic-btn" onClick={check}>Подтвердить</button>
              <button
                className="effect-epic-btn effect-epic-btn--secondary"
                onClick={showAgain}
                disabled={hints <= 0}
              >
                Показать снова ({hints})
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
