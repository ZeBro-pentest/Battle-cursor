import { useEffect, useState } from "react";

export function CaptchaEffect({ onComplete }: { onComplete: () => void }) {
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const urgent = seconds <= 10;

  return (
    <div className="effect-captcha">
      <div className={`effect-captcha-box${urgent ? " effect-captcha-box--urgent" : ""}`}>
        <p>Докажи что ты не робот</p>
        <span className={`effect-captcha-timer${urgent ? " effect-captcha-timer--urgent" : ""}`}>
          {seconds}с
        </span>
        <label>
          <input type="checkbox" onChange={onComplete} />
          {" "}Я не робот
        </label>
      </div>
    </div>
  );
}
