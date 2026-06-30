import { useState } from "react";

const SETS = [
  {
    task: "Выберите все 🌊",
    target: "🌊",
    items: ["🌊", "🔥", "🌲", "🌊", "⭐", "🎭", "🌊", "🌙", "🔥"],
  },
  {
    task: "Выберите все ⭐",
    target: "⭐",
    items: ["🌊", "⭐", "🔥", "🌲", "⭐", "🎭", "🌙", "⭐", "🌊"],
  },
  {
    task: "Выберите все 🔥",
    target: "🔥",
    items: ["🔥", "🌊", "⭐", "🔥", "🌲", "🎭", "🌙", "🔥", "⭐"],
  },
];

export function VerifyEffect({ onComplete }: { onComplete: () => void }) {
  const [set] = useState(() => SETS[Math.floor(Math.random() * SETS.length)]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState(false);

  const toggle = (i: number) => {
    setError(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const verify = () => {
    const correct = set.items
      .map((item, i) => (item === set.target ? i : -1))
      .filter((i) => i !== -1);
    const ok = correct.length === selected.size && correct.every((i) => selected.has(i));
    if (ok) {
      onComplete();
    } else {
      setError(true);
      setSelected(new Set());
      setTimeout(() => setError(false), 1000);
    }
  };

  return (
    <div className="effect-epic-overlay">
      <div className="effect-epic-box">
        <p className="effect-epic-title">Капча</p>
        <p className="effect-epic-text">{set.task}</p>
        <div className="effect-verify-grid">
          {set.items.map((item, i) => (
            <button
              key={i}
              className={[
                "effect-verify-cell",
                selected.has(i) ? "effect-verify-cell--selected" : "",
                error ? "effect-verify-cell--error" : "",
              ].filter(Boolean).join(" ")}
              onClick={() => toggle(i)}
            >
              {item}
            </button>
          ))}
        </div>
        {error && <p className="effect-epic-error">Неверно! Попробуй снова</p>}
        <button className="effect-epic-btn" onClick={verify}>Проверить</button>
      </div>
    </div>
  );
}
