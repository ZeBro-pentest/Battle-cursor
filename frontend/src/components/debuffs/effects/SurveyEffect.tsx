import { useState } from "react";

const SURVEYS = [
  {
    q: "Как вы оцениваете качество этого дебаффа?",
    opts: ["Отлично", "Хорошо", "Плохо", "Ужасно"],
  },
  {
    q: "Как часто вы рисуете?",
    opts: ["Каждый день", "Иногда", "Редко", "Никогда"],
  },
  {
    q: "Ваш любимый цвет?",
    opts: ["Красный", "Синий", "Зелёный", "Жёлтый"],
  },
];

export function SurveyEffect({ onComplete }: { onComplete: () => void }) {
  const [survey] = useState(() => SURVEYS[Math.floor(Math.random() * SURVEYS.length)]);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="effect-epic-overlay">
      <div className="effect-epic-box">
        <p className="effect-epic-title">Опрос</p>
        <p className="effect-epic-text">{survey.q}</p>
        <div className="effect-survey-options">
          {survey.opts.map((opt) => (
            <label
              key={opt}
              className={`effect-survey-option${selected === opt ? " effect-survey-option--selected" : ""}`}
            >
              <input
                type="radio"
                name="survey"
                value={opt}
                checked={selected === opt}
                onChange={() => setSelected(opt)}
              />
              {opt}
            </label>
          ))}
        </div>
        <button className="effect-epic-btn" onClick={onComplete} disabled={!selected}>
          Отправить
        </button>
      </div>
    </div>
  );
}
