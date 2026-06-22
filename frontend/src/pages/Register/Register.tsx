import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { authAPI } from "../../services/api";
import "./Register.css";

const schema = z
  .object({
    email: z.string().email("Неверный формат email"),
    username: z.string().min(3, "Минимум 3 символа"),
    password: z
      .string()
      .min(8, "Минимум 8 символов")
      .regex(/\d/, "Нужна хотя бы одна цифра")
      .regex(/[a-zA-Z]/, "Нужна хотя бы одна буква"),
    password_confirm: z.string().min(1, "Подтвердите пароль"),
  })
  .refine((d) => d.password === d.password_confirm, {
    message: "Пароли не совпадают",
    path: ["password_confirm"],
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

function getStrength(pwd: string): { level: number; label: string; color: string } {
  if (!pwd) return { level: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[a-zA-Z]/.test(pwd) && /\d/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  if (score <= 2) return { level: 1, label: "Слабый",  color: "#cc3333" };
  if (score === 3) return { level: 2, label: "Средний", color: "#cc8800" };
  return              { level: 3, label: "Хороший", color: "#88aa00" };
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

export function Register() {
  const [serverError, setServerError] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [shaking, setShaking] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const passwordValue = watch("password") ?? "";
  const strength = getStrength(passwordValue);

  const onSubmit = async (data: FormData) => {
    setServerError("");
    try {
      await authAPI.register(data);
      setRegisteredEmail(data.email);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (detail) {
        setServerError(detail);
      } else {
        const firstError = Object.values(err.response?.data ?? {})[0];
        setServerError(
          Array.isArray(firstError) ? firstError[0] : "Ошибка регистрации."
        );
      }
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
    }
  };

  const leftPanel = (
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
  );

  if (registeredEmail) {
    return (
      <div className="auth-page">
        {leftPanel}
        <div className="auth-panel-right">
          <div className="auth-success-screen">
            <div className="auth-success-icon">✉</div>
            <h2 className="auth-success-title">ПИСЬМО ОТПРАВЛЕНО</h2>
            <p className="auth-success-msg">
              Письмо отправлено на <strong style={{ color: "#fff" }}>{registeredEmail}</strong>,
              подтвердите почту чтобы войти в игру.
            </p>
            <p className="auth-footer">
              <Link to="/login">Перейти ко входу →</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {leftPanel}

      <div className="auth-panel-right">
        <h1 className="auth-title">Регистрация</h1>
        <p className="auth-subtitle">Создайте аккаунт чтобы начать</p>

        <form
          className={`auth-form${shaking ? " shake" : ""}`}
          onSubmit={handleSubmit(onSubmit)}
        >
          {serverError && <div className="auth-server-error">{serverError}</div>}

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
            <label className="auth-label">Имя пользователя</label>
            <div className="auth-input-wrap">
              <input
                {...register("username")}
                className={`auth-input${errors.username ? " input-error" : ""}`}
                placeholder="username"
                autoComplete="username"
              />
            </div>
            {errors.username && (
              <span className="auth-error-msg">{errors.username.message}</span>
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
                autoComplete="new-password"
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

          <div className="auth-field">
            <label className="auth-label">Подтвердите пароль</label>
            <div className="auth-input-wrap">
              <input
                {...register("password_confirm")}
                type={showPasswordConfirm ? "text" : "password"}
                className={`auth-input has-toggle${errors.password_confirm ? " input-error" : ""}`}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-toggle-btn"
                onClick={() => setShowPasswordConfirm((v) => !v)}
                tabIndex={-1}
              >
                <EyeIcon open={showPasswordConfirm} />
              </button>
            </div>
            {errors.password_confirm && (
              <span className="auth-error-msg">{errors.password_confirm.message}</span>
            )}
            {passwordValue && (
              <div className="auth-strength">
                <div className="auth-strength-bars">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="auth-strength-bar"
                      style={{ background: n <= strength.level ? strength.color : undefined }}
                    />
                  ))}
                </div>
                <span className="auth-strength-label" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          <button type="submit" className="auth-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="auth-spinner" />
                РЕГИСТРАЦИЯ...
              </>
            ) : (
              "СОЗДАТЬ АККАУНТ"
            )}
          </button>
        </form>

        <p className="auth-footer">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
}
