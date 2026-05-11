import './Header.css';

export function Header() {
  return (
    <header>
      <div className="logo">
        <img src="/logo.png" alt="Battle_cursor Logo" />
      </div>
      <div className="header-text">
        <p className="project-label">Project name:</p>
        <h1>Battle_<span className="text-red">cursor</span></h1>
      </div>
      <nav className="header-nav">
        <a href="#features">Особенности</a>
        <a href="#how-it-works">Как играть</a>
        <a href="#stats">Статистика</a>
        <button className="nav-cta">Войти</button>
      </nav>
    </header>
  );
}