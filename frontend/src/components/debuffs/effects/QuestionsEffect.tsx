import { useState, useEffect, useCallback } from "react";

const QUESTIONS = [
  { q: "Сколько цветов в радуге?",         correct: "7",       options: ["5", "6", "7", "8"] },
  { q: "Столица Франции?",                  correct: "Париж",   options: ["Лондон", "Берлин", "Париж", "Рим"] },
  { q: "2 + 2 × 2 = ?",                    correct: "6",       options: ["4", "6", "8", "16"] },
  { q: "Самая большая планета?",            correct: "Юпитер",  options: ["Земля", "Сатурн", "Юпитер", "Нептун"] },
  { q: "Сколько букв в русском алфавите?", correct: "33",      options: ["30", "31", "33", "36"] },
];

type Window = { id: number; q: (typeof QUESTIONS)[0] };

const randQ = () => QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];

const BOTTOMS = [20, 200, 380];

export function QuestionsEffect({ onComplete }: { onComplete: () => void }) {
  const [windows, setWindows] = useState<Window[]>([{ id: 0, q: randQ() }]);
  const [wrongMap, setWrongMap] = useState<Record<number, string | null>>({});

  useEffect(() => {
    if (windows.length >= 3) return;
    const t = setTimeout(() => {
      setWindows((prev) => {
        if (prev.length >= 3) return prev;
        return [...prev, { id: Date.now(), q: randQ() }];
      });
    }, 5000);
    return () => clearTimeout(t);
  }, [windows.length]);

  const handlePick = useCallback(
    (id: number, opt: string, correct: string) => {
      if (opt === correct) {
        setWindows((prev) => {
          const next = prev.filter((w) => w.id !== id);
          if (next.length === 0) setTimeout(onComplete, 0);
          return next;
        });
      } else {
        setWrongMap((prev) => ({ ...prev, [id]: opt }));
        setTimeout(() => setWrongMap((prev) => ({ ...prev, [id]: null })), 800);
      }
    },
    [onComplete],
  );

  return (
    <>
      {windows.map((w, i) => (
        <div
          key={w.id}
          className="effect-questions-window"
          style={{ bottom: BOTTOMS[i] ?? 20 }}
        >
          <p className="effect-questions-title">❓ Вопрос</p>
          <p className="effect-questions-text">{w.q.q}</p>
          <div className="effect-questions-opts">
            {w.q.options.map((opt) => (
              <button
                key={opt}
                className={`effect-questions-opt${wrongMap[w.id] === opt ? " effect-questions-opt--wrong" : ""}`}
                onClick={() => handlePick(w.id, opt, w.q.correct)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
