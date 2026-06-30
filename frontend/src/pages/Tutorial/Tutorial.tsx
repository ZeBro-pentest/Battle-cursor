import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { ReactNode } from "react";
import type { RootState } from "../../store/store";
import images from "../../assets/cloudinary-images.json";
import { DEBUFF_MAP, DEBUFF_RARITY_COLOR } from "../../constants/debuffs";
import { PlayerCard, EmptyPlayerCard } from "../../components/PlayerCard/PlayerCard";
import "./Tutorial.css";

const LOBBY_MOCK = [
  { username: "Dragon_84",   isHost: true },
  { username: "Chaos_Brush", isHost: false },
  { username: "ArtMaster",   isHost: false },
  { username: "NightOwl",    isHost: false },
  { username: "PixelQueen",  isHost: false },
];

function LobbyVisual() {
  return (
    <div className="tut-visual tut-lobby-visual">
      <div className="tut-lobby-meta">
        <span className="tut-lobby-code-sm">6X9F</span>
        <span className="tut-lobby-count">5 / 8 игроков</span>
      </div>
      <div className="tut-lobby-grid">
        {LOBBY_MOCK.map((p) => (
          <PlayerCard
            key={p.username}
            username={p.username}
            cursor={null}
            canvas={null}
            isHost={p.isHost}
            isCurrentUser={false}
          />
        ))}
        {[0, 1, 2].map((i) => (
          <EmptyPlayerCard key={`e${i}`} />
        ))}
      </div>
    </div>
  );
}

function RoundVisual() {
  return (
    <div className="tut-visual">
      <div className="tut-round-bar">
        <span className="tut-round-tag">РАУНД 3 / 5</span>
        <span className="tut-timer">00:47</span>
      </div>
      <div className="tut-prompt-box">
        <span className="tut-prompt-label">ПРОМПТ</span>
        <span className="tut-prompt-text">"Нарисуй кота в невесомости"</span>
      </div>
      <div className="tut-sketch">
        <svg viewBox="0 0 300 110" width="100%" preserveAspectRatio="xMidYMid meet">
          <ellipse cx="150" cy="72" rx="50" ry="34" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" fill="none" />
          <ellipse cx="150" cy="45" rx="24" ry="19" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" fill="none" />
          <line x1="128" y1="32" x2="110" y2="16" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
          <line x1="172" y1="32" x2="190" y2="16" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
          <circle cx="141" cy="47" r="2.5" fill="rgba(255,255,255,0.55)" />
          <circle cx="159" cy="47" r="2.5" fill="rgba(255,255,255,0.55)" />
          <line x1="136" y1="57" x2="118" y2="52" stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
          <line x1="164" y1="57" x2="182" y2="52" stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
          <path d="M 200 82 Q 240 60 258 100" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" fill="none" />
        </svg>
      </div>
    </div>
  );
}

const AI_SCORES = [
  { name: "ArtMaster",   score: 4.8, comment: "Отлично! Точная передача формы." },
  { name: "PixelQueen",  score: 4.2, comment: "Хорошая работа, образ узнаваем." },
  { name: "Dragon_84",   score: 3.5, comment: "Неплохо, но можно точнее." },
  { name: "Chaos_Brush", score: 1.9, comment: "Слабо угадывается тема." },
];

function AIScoreVisual() {
  return (
    <div className="tut-visual tut-results-visual">
      <div className="tut-results-header">
        <span className="tut-results-title">Результаты раунда</span>
        <span className="tut-results-next">Следующий через 10с</span>
      </div>
      <div className="tut-results-grid">
        {AI_SCORES.map((s, i) => (
          <div key={s.name} className="tut-result-card">
            <span className="tut-result-rank">#{i + 1}</span>
            <div className="tut-result-img-placeholder" />
            <span className="tut-result-username">{s.name}</span>
            <span className="tut-result-score">{s.score.toFixed(1)}</span>
            <p className="tut-result-comment">{s.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DebuffsVisual() {
  const ids = ["blur", "freeze", "maze", "glitch", "rickroll", "shake", "puzzle", "siren", "disco", "captcha", "fog", "zoom"];
  return (
    <div className="tut-visual">
      <div className="tut-debuffs-grid">
        {ids.map((id) => {
          const d = DEBUFF_MAP[id];
          return (
            <div key={id} className="tut-debuff" style={{ borderColor: DEBUFF_RARITY_COLOR[d.rarity] + "77" }}>
              <span className="tut-debuff-name">{d.name}</span>
              <span className="tut-debuff-rarity" style={{ color: DEBUFF_RARITY_COLOR[d.rarity] }}>{d.rarity}</span>
            </div>
          );
        })}
      </div>
      <div className="tut-status">60+ дебаффов · 5 уровней редкости</div>
    </div>
  );
}

function ShopVisual() {
  const keys = [
    "images/cursors/Chaos_cursor.png",
    "images/cursors/Overlord_cursor.png",
    "images/cursors/Phantom_cursor.png",
    "images/cursors/Virus_cursor.png",
    "images/cursors/Hybrid_cursor.png",
    "images/cursors/Tornado_cursor.png",
  ];
  return (
    <div className="tut-visual">
      <div className="tut-shop-label">Магазин курсоров</div>
      <div className="tut-cursors-grid">
        {keys.map((key) => {
          const name = key.split("/").pop()!.replace("_cursor.png", "");
          return (
            <div key={key} className="tut-cursor-card">
              <img src={(images as Record<string, string>)[key]} alt={name} className="tut-cursor-img" />
              <span>{name}</span>
            </div>
          );
        })}
      </div>
      <div className="tut-status">Трать монеты на курсоры и холсты</div>
    </div>
  );
}

interface Step {
  title: string;
  description: string;
  visual: ReactNode;
}

const steps: Step[] = [
  {
    title: "Как работает игра",
    description:
      "Хост создаёт комнату, до 8 игроков заходят в лобби. Когда хост нажимает «Начать» — запускается обратный отсчёт 3-2-1 и стартует первый раунд.",
    visual: <LobbyVisual />,
  },
  {
    title: "Раунды и промпты",
    description:
      "Количество раундов равно количеству игроков (максимум 8). В начале каждого раунда AI генерирует промпт на русском — например «Нарисуй кота». У тебя 60 секунд чтобы нарисовать его на холсте.",
    visual: <RoundVisual />,
  },
  {
    title: "Оценка от Groq AI",
    description:
      "После окончания раунда Groq AI оценивает каждый рисунок по шкале 0.1–5.0 — насколько точно он соответствует промпту. За каждый балл начисляется 10 монет.",
    visual: <AIScoreVisual />,
  },
  {
    title: "Дебаффы",
    description:
      "Выбери цель клавишами A/D (или кликом на карточку игрока), выбери дебафф клавишами W/S, примени пробелом или кнопкой «Применить». Каждый дебафф можно использовать только один раз за раунд. Нельзя применять дебаффы в последние 5 секунд раунда. Холст даёт одноразовую защиту от некоторых дебаффов.",
    visual: <DebuffsVisual />,
  },
  {
    title: "Монеты и магазин",
    description:
      "Монеты зарабатываются за хорошие рисунки. Трать их в магазине на новые курсоры и холсты с уникальными дебаффами и защитами. Победитель раунда получает +1 к рейтингу.",
    visual: <ShopVisual />,
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
              {step.visual}
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
          <button className="cta-button primary large" onClick={handlePlay}>
            Начать игру
          </button>
        </div>
      </section>
    </div>
  );
}
