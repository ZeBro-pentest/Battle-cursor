import { useEffect } from "react";
import { Link } from "react-router-dom";
import "./NotFound.css";

export function NotFound() {
  useEffect(() => {
    // Disable scrolling when 404 is active
    const originalOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      // Re-enable scrolling when leaving 404
      document.documentElement.style.overflow = originalOverflow;
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1 className="error-code" data-text="404">
          404
        </h1>
        <div className="divider"></div>
        <h2 className="error-message">Сигнал потерян</h2>
        <p className="error-description">
          Похоже, ваш курсор забрел в неизведанную зону. Эта страница не
          существует или была перемещена.
        </p>
        <Link to="/" className="back-home-button">
          Вернуться на базу
        </Link>
      </div>
    </div>
  );
}
