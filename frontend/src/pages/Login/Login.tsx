import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { authAPI } from "../../services/api";
import { setAccessToken } from "../../store/authSlice";
import "./Login.css";

const RESEND_COOLDOWN = 300; // 5 минут

function useResendCooldown() {
  const [cooldown, setCooldown] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    setCooldown(RESEND_COOLDOWN);
    timer.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) { clearInterval(timer.current!); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return { cooldown, start, fmt };
}

const schema = z.object({
  email: z.string().email("Неверный формат email"),
  password: z.string().min(1, "Введите пароль"),
});

type FormData = z.infer<typeof schema>;

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

const CURSORS = [
  { top: "18%", left: "12%", dur: "9s",   delay: "0s" },
  { top: "62%", left: "68%", dur: "11s",  delay: "2.5s" },
  { top: "78%", left: "22%", dur: "7.5s", delay: "1s" },
  { top: "38%", left: "58%", dur: "13s",  delay: "4s" },
  { top: "50%", left: "38%", dur: "10s",  delay: "3s" },
];

const FEATURES = [
  "До 8 игроков в одной комнате",
  "Рисуй по промпту от ИИ за 60 секунд",
  "Применяй дебаффы на противников",
  "Зарабатывай монеты и рейтинг",
];

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const { cooldown, start: startCooldown, fmt } = useResendCooldown();

  const verified = (location.state as any)?.verified === true;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    try {
      const response = await authAPI.login(data);
      dispatch(setAccessToken(response.data.access));
      navigate("/main");
    } catch (err: any) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      if (status === 403) {
        setServerError("Подтвердите email перед входом — проверьте почту и папку «Спам».");
        setUnverifiedEmail(data.email);
      } else {
        setServerError(detail || "Неверный email или пароль");
      }
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
    }
  };

  return (
    <div className="auth-page">
      {/* ── Left decorative panel ── */}
      <div className="auth-panel-left">
        <div className="auth-bg-grid" />
        <div className="auth-vignette" />
        <div className="auth-cursors">
          {CURSORS.map((c, i) => (
            <svg
              key={i}
              className="auth-cursor-float"
              style={{ top: c.top, left: c.left, "--dur": c.dur, "--delay": c.delay } as any}
              viewBox="0 0 24 24"
              fill="white"
            >
              <path d="M4 2L20 9.6L12.4 12.4L9.6 20L4 2Z" />
            </svg>
          ))}
        </div>
        <div className="auth-left-content">
          <div className="auth-brand">
            <span className="auth-brand-glitch" data-text="BATTLE">BATTLE</span>
            <span className="auth-brand-red">_CURSOR</span>
          </div>
          <p className="auth-tagline">PvP рисование — быстро и жёстко</p>
          <ul className="auth-features">
            {FEATURES.map((text, i) => (
              <li key={i} className="auth-feature">
                <span className="auth-feature-dot" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-panel-right">
        <h1 className="auth-title">Вход</h1>
        <p className="auth-subtitle">Добро пожаловать обратно</p>

        <form
          className={`auth-form${shaking ? " shake" : ""}`}
          onSubmit={handleSubmit(onSubmit)}
        >
          {verified && (
            <div className="auth-verified-banner">
              Email подтверждён — теперь можно войти
            </div>
          )}
          {serverError && <div className="auth-server-error">{serverError}</div>}
          {unverifiedEmail && (
            <div className="auth-resend-row">
              <button
                type="button"
                className="auth-resend-btn"
                disabled={cooldown > 0}
                onClick={async () => {
                  setResendMsg("");
                  try {
                    await authAPI.resendVerification(unverifiedEmail);
                    setResendMsg("Письмо отправлено");
                    startCooldown();
                  } catch {
                    setResendMsg("Ошибка отправки");
                  }
                }}
              >
                {cooldown > 0 ? `Отправить снова через ${fmt(cooldown)}` : "Отправить письмо повторно"}
              </button>
              {resendMsg && <span className="auth-resend-msg">{resendMsg}</span>}
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label">Email</label>
            <div className="auth-input-wrap">
              <input
                {...register("email")}
                type="email"
                className={`auth-input${errors.email ? " input-error" : ""}`}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            {errors.email && (
              <span className="auth-error-msg">{errors.email.message}</span>
            )}
          </div>

          <div className="auth-field">
            <label className="auth-label">Пароль</label>
            <div className="auth-input-wrap">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                className={`auth-input has-toggle${errors.password ? " input-error" : ""}`}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-toggle-btn"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
            {errors.password && (
              <span className="auth-error-msg">{errors.password.message}</span>
            )}
          </div>

          <button type="submit" className="auth-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="auth-spinner" />
                ВХОД...
              </>
            ) : (
              "ВОЙТИ"
            )}
          </button>
        </form>

        <p className="auth-footer">
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}
