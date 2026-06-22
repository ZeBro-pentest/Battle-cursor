import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import "./Tutorial.css";

const steps = [
  {
    title: "Основы управления",
    description:
      "Ваш курсор — это ваше оружие. Двигайтесь быстро, но точно. В Battle Cursor каждое микродвижение имеет значение для выживания на арене.",
    image:
      "https://via.placeholder.com/600x400/1a1a1a/ff4d4d?text=Step+1:+Movement",
  },
  {
    title: "Атаки и способности",
    description:
      "Используйте левую кнопку мыши для базовой атаки и специальные клавиши для активации уникальных способностей вашего скина. Комбинируйте их для максимального урона.",
    image:
      "https://via.placeholder.com/600x400/1a1a1a/ff4d4d?text=Step+2:+Abilities",
  },
  {
    title: "Сбор ресурсов",
    description:
      "На арене появляются энергетические сферы. Собирайте их, чтобы заряжать ультимативную способность и восстанавливать щиты прямо во время боя.",
    image:
      "https://via.placeholder.com/600x400/1a1a1a/ff4d4d?text=Step+3:+Resources",
  },
  {
    title: "Тактика уклонения",
    description:
      "Не задерживайтесь на одном месте. Враги будут пытаться предугадать вашу траекторию. Используйте рывки, чтобы мгновенно сменить позицию.",
    image:
      "https://via.placeholder.com/600x400/1a1a1a/ff4d4d?text=Step+4:+Evasion",
  },
  {
    title: "Финальная битва",
    description:
      "В конце раунда арена сужается. Вытесните противников в красную зону и станьте последним выжившим курсором, чтобы забрать главный приз.",
    image:
      "https://via.placeholder.com/600x400/1a1a1a/ff4d4d?text=Step+5:+Victory",
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
          <h2>Теперь вы готовы к бою!</h2>
          <button className="cta-button primary large" onClick={handlePlay}>Начать игру</button>
        </div>
      </section>
    </div>
  );
}
