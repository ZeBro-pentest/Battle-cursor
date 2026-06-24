import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import "./Tutorial.css";

const steps = [
  {
    title: "Как работает игра",
    description:
      "Хост создаёт комнату, до 8 игроков заходят в лобби. Когда хост нажимает «Начать» — запускается обратный отсчёт 3-2-1 и стартует первый раунд.",
    image:
      "https://via.placeholder.com/600x400/1a1a1a/ff4d4d?text=01:+Lobby",
  },
  {
    title: "Раунды и промпты",
    description:
      "Количество раундов равно количеству игроков (максимум 8). В начале каждого раунда AI генерирует промпт на русском — например «Нарисуй кота». У тебя 60 секунд чтобы нарисовать его на холсте.",
    image:
      "https://via.placeholder.com/600x400/1a1a1a/ff4d4d?text=02:+Rounds",
  },
  {
    title: "Оценка от Groq AI",
    description:
      "После окончания раунда Groq AI оценивает каждый рисунок по шкале 0.1–5.0 — насколько точно он соответствует промпту. За каждый балл начисляется 10 монет.",
    image:
      "https://via.placeholder.com/600x400/1a1a1a/ff4d4d?text=03:+AI+Score",
  },
  {
    title: "Дебаффы",
    description:
      "Во время рисования можно применять дебаффы на противников — 60+ эффектов пяти уровней редкости от Common до Legendary. Дебаффы зависят от твоего курсора. Холст даёт защиту от некоторых дебаффов.",
    image:
      "https://via.placeholder.com/600x400/1a1a1a/ff4d4d?text=04:+Debuffs",
  },
  {
    title: "Монеты и магазин",
    description:
      "Монеты зарабатываются за хорошие рисунки. Трать их в магазине на новые курсоры и холсты с уникальными дебаффами и защитами. Победитель раунда получает +1 к рейтингу.",
    image:
      "https://via.placeholder.com/600x400/1a1a1a/ff4d4d?text=05:+Shop",
  },
];

export function Tutorial() {
  const navigate = useNavigate();
  const isLoggedIn = useSelector((state: RootState) => !!state.auth.accessToken);

  const handlePlay = () => navigate(isLoggedIn ? "/main" : "/register");

  return (
    <div className="tutorial-page">
      <div className="container tutorial-steps">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`tutorial-step ${index % 2 !== 0 ? "reverse" : ""}`}
          >
            <div className="step-image-container">
              <img src={step.image} alt={step.title} className="step-image" />
              <div className="step-number-badge">0{index + 1}</div>
            </div>
            <div className="step-content">
              <h2 className="step-title">{step.title}</h2>
              <div className="step-divider"></div>
              <p className="step-description">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="tutorial-footer">
        <div className="container">
          <h2>Готов рисовать?</h2>
          <button className="cta-button primary large" onClick={handlePlay}>Начать игру</button>
        </div>
      </section>
    </div>
  );
}
