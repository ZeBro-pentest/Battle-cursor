import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/store';
import { clearAuth } from '../../store/authSlice';
import { authAPI, userAPI } from '../../services/api';
import cloudinaryImages from '../../assets/cloudinary-images.json';
import './Header.css';

export function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.accessToken);
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (!token) {
      setUsername('');
      return;
    }
    userAPI.getProfile()
      .then((res) => setUsername(res.data.username))
      .catch(() => {});
  }, [token]);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // токен мог уже истечь — всё равно разлогиниваем
    }
    dispatch(clearAuth());
    navigate('/login');
  };

  return (
    <header>
      <a
        className="logo"
        href="https://github.com/ZeBro-pentest/Battle-cursor"
        target="_blank"
        rel="noopener noreferrer"
        title="GitHub репозиторий"
      >
        <img src={cloudinaryImages['logo.png']} alt="Battle_cursor Logo" />
      </a>
      <Link to="/main" className="header-text">
        <p className="project-label">Project name:</p>
        <h1>Battle_<span className="text-red">cursor</span></h1>
      </Link>
      <nav className="header-nav">
        {token ? (
          <>
            {username && (
              <Link to="/profile" className="nav-username" data-text={username}>
                {username}
              </Link>
            )}
            <button className="nav-cta" onClick={handleLogout}>Выйти</button>
          </>
        ) : (
          <>
            <a href="#features">Особенности</a>
            <a href="#how-it-works">Как играть</a>
            <a href="#stats">Статистика</a>
            <button className="nav-cta" onClick={() => navigate('/login')}>Войти</button>
          </>
        )}
      </nav>
    </header>
  );
}