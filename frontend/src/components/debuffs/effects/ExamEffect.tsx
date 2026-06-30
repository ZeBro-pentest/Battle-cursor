import { useState, useEffect } from "react";
import type React from "react";

const QUESTIONS = [
  { q: "Сколько цветов в радуге?",         correct: "7",       options: ["5", "6", "7", "8"] },
  { q: "Столица Франции?",                  correct: "Париж",   options: ["Лондон", "Берлин", "Париж", "Рим"] },
  { q: "2 + 2 × 2 = ?",                    correct: "6",       options: ["4", "6", "8", "16"] },
  { q: "Самая большая планета?",            correct: "Юпитер",  options: ["Земля", "Сатурн", "Юпитер", "Нептун"] },
  { q: "Сколько букв в русском алфавите?", correct: "33",      options: ["30", "31", "33", "36"] },
];

export function ExamEffect({
  onComplete,
  canvasRef,
}: {
  onComplete: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}) {
  const [qIdx, setQIdx] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);

  useEffect(() => {
    return () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.style.transform = "";
        canvas.style.transformOrigin = "";
      }
    };
  }, []);

  const handlePick = (opt: string) => {
    if (flash) return;
    const q = QUESTIONS[qIdx];
    const correct = opt === q.correct;
    const newScale = correct ? Math.max(0.4, scale - 0.1) : Math.min(1.8, scale + 0.1);
    setScale(newScale);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.transform = `scale(${newScale})`;
      canvas.style.transformOrigin = "center center";
    }
    setFlash(correct ? "correct" : "wrong");
    setTimeout(() => {
      setFlash(null);
      if (qIdx + 1 >= QUESTIONS.length) {
        onComplete();
      } else {
        setQIdx((i) => i + 1);
      }
    }, 600);
  };

  const q = QUESTIONS[qIdx];

  return (
    <div className="effect-epic-overlay">
      <div className={`effect-epic-box${flash ? ` effect-exam-flash--${flash}` : ""}`}>
        <p className="effect-epic-title">🎓 Экзамен ({qIdx + 1} / {QUESTIONS.length})</p>
        <p className="effect-epic-text">{q.q}</p>
        <p className="effect-exam-scale-hint">Масштаб холста: {Math.round(scale * 100)}%</p>
        <div className="effect-quiz-options">
          {q.options.map((opt) => (
            <button
              key={opt}
              className="effect-epic-btn effect-quiz-opt"
              onClick={() => handlePick(opt)}
              disabled={flash !== null}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
