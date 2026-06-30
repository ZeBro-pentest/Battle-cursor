import { useEffect, useState } from "react";

export function BlockingEffect({ onComplete }: { onComplete: () => void }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="effect-blocking">
      <div className="effect-blocking-box">
        {loading ? (
          <>
            <p>Подключение к холсту...</p>
            <div className="effect-blocking-progress">
              <div className="effect-blocking-progress-bar" />
            </div>
          </>
        ) : (
          <>
            <p>⚠️ Ошибка подключения к холсту</p>
            <button className="effect-blocking-btn" onClick={onComplete}>
              Повторить
            </button>
          </>
        )}
      </div>
    </div>
  );
}
