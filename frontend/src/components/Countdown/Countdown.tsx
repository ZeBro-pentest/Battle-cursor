import { useEffect, useState } from "react";
import "./Countdown.css";

const STEPS = ["3", "2", "1", "GO!"];

interface Props {
  onComplete: () => void;
}

export function Countdown({ onComplete }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= STEPS.length) {
      onComplete();
      return;
    }
    const id = setTimeout(() => setStep((s) => s + 1), 1000);
    return () => clearTimeout(id);
  }, [step, onComplete]);

  if (step >= STEPS.length) return null;

  return (
    <div className="countdown-overlay">
      <span key={step} className="countdown-number">
        {STEPS[step]}
      </span>
    </div>
  );
}
