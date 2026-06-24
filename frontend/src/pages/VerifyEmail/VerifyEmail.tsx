import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authAPI } from "../../services/api";
import "./VerifyEmail.css";

type State = "loading" | "success" | "error" | "no-token";

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<State>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setState("no-token");
      return;
    }

    authAPI
      .verifyEmail(token)
      .then(() => {
        setState("success");
        setTimeout(() => {
          navigate("/login", { state: { verified: true } });
        }, 2500);
      })
      .catch((err: any) => {
        const detail = err.response?.data?.detail;
        setErrorMsg(detail || "Ссылка недействительна или уже использована.");
        setState("error");
      });
  }, []);

  return (
    <div className="verify-page">
      <div className="auth-bg-grid" />

      <div className="verify-card">
        {state === "loading" && (
          <>
            <div className="verify-icon verify-icon--loading">
              <span className="auth-spinner" />
            </div>
            <h2 className="verify-title">ПРОВЕРКА</h2>
            <p className="verify-msg">Подтверждаем ваш email...</p>
          </>
        )}

        {state === "success" && (
          <>
            <div className="verify-icon verify-icon--success">✓</div>
            <h2 className="verify-title">EMAIL ПОДТВЕРЖДЁН</h2>
            <p className="verify-msg">
              Перенаправляем на страницу входа...
            </p>
          </>
        )}

        {(state === "error" || state === "no-token") && (
          <>
            <div className="verify-icon verify-icon--error">✕</div>
            <h2 className="verify-title">ОШИБКА</h2>
            <p className="verify-msg">
              {state === "no-token"
                ? "Токен не указан в ссылке."
                : errorMsg}
            </p>
            <p className="auth-footer">
              <Link to="/login">Вернуться ко входу</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
