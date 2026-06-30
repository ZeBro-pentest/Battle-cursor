import { useState } from "react";

const QUESTIONS = [
  { q: "Сколько цветов в радуге?",          correct: "7",       options: ["5", "6", "7", "8"] },
  { q: "Столица Франции?",                   correct: "Париж",   options: ["Лондон", "Берлин", "Париж", "Рим"] },
  { q: "2 + 2 × 2 = ?",                     correct: "6",       options: ["4", "6", "8", "16"] },
  { q: "Самая большая планета?",             correct: "Юпитер",  options: ["Земля", "Сатурн", "Юпитер", "Нептун"] },
  { q: "Сколько букв в русском алфавите?",  correct: "33",      options: ["30", "31", "33", "36"] },
];

export function QuizEffect({ onComplete }: { onComplete: () => void }) {
  const [q] = useState(() => QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]);
  const [wrong, setWrong] = useState<string | null>(null);

  const pick = (opt: string) => {
    if (opt === q.correct) {
      onComplete();
    } else {
      setWrong(opt);
      setTimeout(() => setWrong(null), 800);
    }
  };

  return (
    <div className="effect-epic-overlay">
      <div className="effect-epic-box">
        <p className="effect-epic-title">Вопрос</p>
        <p className="effect-epic-text">{q.q}</p>
        <div className="effect-quiz-options">
          {q.options.map((opt) => (
            <button
              key={opt}
              className={`effect-epic-btn effect-quiz-opt${wrong === opt ? " effect-quiz-opt--wrong" : ""}`}
              onClick={() => pick(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
