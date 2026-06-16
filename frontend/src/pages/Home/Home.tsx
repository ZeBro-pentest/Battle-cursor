import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

export function Home() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";

    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      heroRef.current.style.setProperty("--mouse-x", `${x}px`);
      heroRef.current.style.setProperty("--mouse-y", `${y}px`);
    };

    const hero = heroRef.current;
    if (hero) {
      hero.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      document.documentElement.style.scrollBehavior = "auto";
      if (hero) {
        hero.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero" ref={heroRef}>
        <div className="hero-grid"></div>
        <div className="hero-glow"></div>
        <div className="hero-overlay"></div>
        <div className="container hero-content">
          <div className="badge">New Season: Cyber Red</div>
          <h1 className="hero-title">
            Battle <span className="text-red">Cursor</span>
          </h1>
          <p className="hero-subtitle">
            Арена, где выживают только самые быстрые. <br />
            Докажи свое превосходство в мире цифровых сражений.
          </p>
          <div className="hero-actions">
            <button className="cta-button primary">Играть сейчас</button>
            <Link to="/tutorial" className="cta-button secondary">
              Обучение
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section id="stats" className="stats-bar">
        <div className="container stats-grid">
          <div className="stat-item">
            <span className="stat-value">10K+</span>
            <span className="stat-label">Активных игроков</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">24/7</span>
            <span className="stat-label">Турниры</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">50+</span>
            <span className="stat-label">Уникальных скинов</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Превосходство в деталях</h2>
            <div className="title-underline"></div>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Низкая задержка</h3>
              <p>
                Наша сетевая архитектура оптимизирована для мгновенного отклика
                каждого движения вашего курсора.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Рейтинговые бои</h3>
              <p>
                Сражайтесь с равными по силе противниками и поднимайтесь в
                глобальной лиге мастеров.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Визуальный стиль</h3>
              <p>
                Настройте свой след, ауру и внешний вид курсора, чтобы
                выделяться на поле боя.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="how-it-works">
        <div className="container">
          <h2 className="section-title centered">Как начать битву</h2>
          <div className="steps-grid">
            <div className="step">
              <div className="step-number">01</div>
              <h4>Регистрация</h4>
              <p>Создай свой профиль за считанные секунды.</p>
            </div>
            <div className="step">
              <div className="step-number">02</div>
              <h4>Выбор снаряжения</h4>
              <p>Настрой свой курсор для максимальной точности.</p>
            </div>
            <div className="step">
              <div className="step-number">03</div>
              <h4>Побеждай</h4>
              <p>Врывайся на арену и сокрушай оппонентов.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials (Professional Quote) */}
      <section className="quote-section">
        <div className="quote-bg-decor">
          {(() => {
            const cursorNames = [
              "Absolute", "Arrow", "Blot", "Breach", "Chaos", 
              "Collapse", "Dictator", "Eraser", "Hybrid", "Judge",
              "Mutant", "Overlord", "Parasite", "Pencil", "Phantom",
              "Quill", "Spark", "Stroke", "Stylus", "Tornado",
              "Trap", "Vector", "Virus", "Warper", "Wraith"
            ];
            
            const renderSquares = (isDup = false) => 
              cursorNames.map((name, i) => {
                const path = `/images/cursors/${name}_cursor.png`;
                const canvasPath = `/images/canvas/${name}_canvas.svg`;
                
                return (
                  <div key={isDup ? `dup-${i}` : i} className="decor-square">
                    <img src={canvasPath} alt={`${name} canvas`} className="decor-canvas" />
                    <img src={path} alt={name} className="decor-img" />
                  </div>
                );
              });

            return (
              <>
                {renderSquares()}
                {/* Дублируем для бесшовной анимации */}
                {renderSquares(true)}
              </>
            );
          })()}
        </div>
        <div className="container">
          <div className="quote-box">
            <p className="quote-text">
              "Battle Cursor — это не просто игра, это проверка твоих рефлексов
              на пределе возможностей."
            </p>
            <span className="quote-author">— ProGamer_X, Топ-1 сезона</span>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2 className="cta-title">Готовы бросить вызов?</h2>
          <p className="cta-desc">
            Присоединяйтесь к сообществу Battle Cursor сегодня.
          </p>
          <button className="cta-button primary large">
            Присоединиться бесплатно
          </button>
        </div>
      </section>
    </div>
  );
}
