import { useState } from "react";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
const genPass = () =>
  Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");

export function PasswordEffect({ onComplete }: { onComplete: () => void }) {
  const [pass] = useState(genPass);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const check = () => {
    if (value.trim() === pass) {
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
        <p className="effect-epic-title">Перепиши код</p>
        <div className="effect-code-display">{pass}</div>
        <input
          className={`effect-epic-input${error ? " effect-epic-input--error" : ""}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") check(); }}
          placeholder="Введи код..."
          autoFocus
        />
        {error && <p className="effect-epic-error">Неверно!</p>}
        <button className="effect-epic-btn" onClick={check}>Подтвердить</button>
      </div>
    </div>
  );
}
