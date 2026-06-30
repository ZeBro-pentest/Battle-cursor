import { useState, useCallback } from "react";

const shuffle = (arr: number[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export function PuzzleEffect({ onComplete }: { onComplete: () => void }) {
  const [numbers] = useState(() => shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]));
  const [nextExpected, setNextExpected] = useState(1);
  const [solved, setSolved] = useState<Set<number>>(new Set());

  const handleClick = useCallback((n: number) => {
    if (n !== nextExpected) return;
    const newSolved = new Set([...solved, n]);
    setSolved(newSolved);
    if (n === 9) {
      setTimeout(onComplete, 500);
    } else {
      setNextExpected(n + 1);
    }
  }, [nextExpected, solved, onComplete]);

  const isComplete = solved.size === 9;

  return (
    <div className="effect-puzzle-overlay">
      <div className="effect-puzzle-box">
        <p className="effect-puzzle-title">Собери пазл</p>
        {!isComplete && (
          <p className="effect-puzzle-hint">Нажми: <strong>{nextExpected}</strong></p>
        )}
        {isComplete && (
          <p className="effect-puzzle-done">✓ Готово!</p>
        )}
        <div className="effect-puzzle-grid">
          {numbers.map((n) => {
            const isDone = solved.has(n);
            const isNext = n === nextExpected && !isComplete;
            return (
              <button
                key={n}
                className={[
                  "effect-puzzle-cell",
                  isDone ? "effect-puzzle-cell--done" : "",
                  isNext ? "effect-puzzle-cell--next" : "",
                ].join(" ").trim()}
                onClick={() => handleClick(n)}
                disabled={isDone}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
