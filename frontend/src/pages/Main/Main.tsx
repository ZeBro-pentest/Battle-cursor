import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { userAPI, serversAPI } from "../../services/api";
import type { UserProfile } from "../../types/user";
import "./Main.css";

interface Server {
  room_code: string;
  host: string;
  players_count: number;
  max_players: number;
  status: string;
}

const RARITY_COLOR: Record<string, string> = {
  common: "#aaa",
  rare: "#4488ff",
  epic: "#aa44ee",
  mythic: "#FF0606",
  legendary: "#ffcc00",
};

const FEATURES = [
  { icon: "◈", text: "До 8 игроков в одной комнате одновременно" },
  {
    icon: "⚡",
    text: "60+ дебаффов пяти уровней редкости — от Common до Legendary",
  },
  {
    icon: "★",
    text: "Groq AI оценивает каждый рисунок по шкале от 0.1 до 5.0",
  },
  {
    icon: "◎",
    text: "Монеты за победу — трать в магазине на курсоры и холсты",
  },
];

export function Main() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [servers, setServers] = useState<Server[]>([]);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [serversLoading, setServersLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const fetchServers = useCallback(() => {
    setServersLoading(true);
    serversAPI
      .getServers()
      .then((r) => setServers(r.data))
      .catch(() => {})
      .finally(() => setServersLoading(false));
  }, []);

  useEffect(() => {
    userAPI
      .getProfile()
      .then((r) => setProfile(r.data))
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const handleRefresh = () => {
    fetchServers();
    setCountdown(10);
  };

  const handleDeleteServer = async (room_code: string) => {
    try {
      await serversAPI.deleteServer(room_code);
      fetchServers();
    } catch {}
  };

  const handleCreate = async () => {
    setCreating(true);
    setCreateError("");
    try {
      const { data } = await serversAPI.createServer(maxPlayers);
      navigate(`/games/${data.room_code}`);
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { detail?: string; non_field_errors?: string[] } };
      };
      const msg =
        e?.response?.data?.detail ??
        e?.response?.data?.non_field_errors?.[0] ??
        "Не удалось создать комнату";
      setCreateError(msg);
      setCreating(false);
    }
  };

  const avatarColor = profile?.cursor
    ? (RARITY_COLOR[profile.cursor.rarity] ?? "#888")
    : "#444";
  const avatarHasFrame = !!profile?.canvas?.image_url;

  return (
    <div className="main-page">
      <div className="main-grid">
        {/* ── Левая колонка: Профиль ── */}
        <aside className="main-col main-col--profile">
          <div
            className={`mp-avatar${avatarHasFrame ? " mp-avatar--framed" : ""}`}
            style={{ "--avatar-color": avatarColor } as React.CSSProperties}
          >
            {profile?.cursor?.image_url ? (
              <img src={profile.cursor.image_url} alt={profile.cursor.name} />
            ) : (
              <svg className="mp-avatar-svg" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="17" r="9" stroke="#444" strokeWidth="1.5" />
                <path
                  d="M8 44c0-8.837 7.163-16 16-16s16 7.163 16 16"
                  stroke="#444"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            )}
            {avatarHasFrame && (
              <img src={profile!.canvas!.image_url!} alt="" className="mp-avatar-frame" />
            )}
          </div>

          {profileLoading ? (
            <p className="mp-loading">загрузка...</p>
          ) : profile ? (
            <>
              <h2 className="mp-username">{profile.username}</h2>

              <div className="mp-stats">
                <div className="mp-stat mp-stat--coins">
                  <span className="mp-stat-value">{profile.coins}</span>
                  <span className="mp-stat-label">монет</span>
                </div>
                <div className="mp-stat-sep" />
                <div className="mp-stat">
                  <span className="mp-stat-value">{profile.rating}</span>
                  <span className="mp-stat-label">рейтинг</span>
                </div>
              </div>

              {(profile.cursor || profile.canvas) && (
                <div className="mp-equipped-list">
                  {profile.cursor && (
                    <div className="mp-equipped">
                      <span className="mp-eq-key">Курсор</span>
                      <span
                        className="mp-eq-val"
                        style={{
                          color: RARITY_COLOR[profile.cursor.rarity] ?? "#aaa",
                        }}
                      >
                        {profile.cursor.name}
                      </span>
                    </div>
                  )}
                  {profile.canvas && (
                    <div className="mp-equipped">
                      <span className="mp-eq-key">Холст</span>
                      <span
                        className="mp-eq-val"
                        style={{
                          color: RARITY_COLOR[profile.canvas.rarity] ?? "#aaa",
                        }}
                      >
                        {profile.canvas.name}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}

          <nav className="mp-nav">
            <button
              className="mp-nav-link"
              onClick={() => navigate("/profile")}
            >
              Профиль
            </button>
            <button className="mp-nav-link" onClick={() => navigate("/shop")}>
              Магазин
            </button>
            <button
              className="mp-nav-link"
              onClick={() => navigate("/inventory")}
            >
              Инвентарь
            </button>
            <button
              className="mp-nav-link"
              onClick={() => navigate("/purchases")}
            >
              Покупки
            </button>
          </nav>
        </aside>

        {/* ── Центральная колонка: Уведомления ── */}
        <section className="main-col main-col--center">
          <p className="mc-col-label">// Уведомления</p>
          <div className="mc-welcome-frame">
            <p className="mc-tag">// ДОБРО ПОЖАЛОВАТЬ</p>
            <h3 className="mc-welcome-heading">
              {profile ? (
                <>
                  Здравствуйте,{" "}
                  <span className="mc-name">{profile.username}</span>!
                </>
              ) : (
                "Здравствуйте!"
              )}
            </h3>
            <p className="mc-welcome-text">
              Мы рады вас видеть! Это{" "}
              <span className="mc-accent">Battle_cursor</span> — браузерная
              PvP-игра, где до 8 игроков рисуют по промптам от искусственного
              интеллекта, применяют дебаффы друг другу и борются за лучшую
              оценку от Groq AI. Зарабатывай монеты, прокачивай арсенал и
              покоряй таблицу лидеров.
            </p>
            <ul className="mc-features">
              {FEATURES.map((f, i) => (
                <li
                  key={i}
                  className="mc-feature"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <span className="mc-feature-icon">{f.icon}</span>
                  <span>{f.text}</span>
                </li>
              ))}
            </ul>
            <button
              className="mc-tutorial-btn"
              onClick={() => navigate("/tutorial")}
            >
              Как играть
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </section>

        {/* ── Правая колонка: Лобби ── */}
        <aside className="main-col main-col--lobby">
          <div className="ml-section">
            <div className="ml-section-header">
              <p className="ml-eyebrow">// Активные комнаты</p>
              <button
                className="ml-refresh-btn"
                onClick={handleRefresh}
                disabled={countdown > 0}
              >
                {countdown > 0 ? `Обновить (${countdown}с)` : "Обновить"}
              </button>
            </div>
            <div className="ml-servers">
              {serversLoading ? (
                <p className="ml-hint">загрузка...</p>
              ) : servers.length === 0 ? (
                <p className="ml-hint">Нет активных комнат</p>
              ) : (
                [...servers]
                  .sort((a, b) =>
                    a.host === profile?.username ? -1 : b.host === profile?.username ? 1 : 0,
                  )
                  .map((s) => {
                  const full = s.players_count >= s.max_players;
                  const isOwn = s.host === profile?.username;
                  const slots = Array.from(
                    { length: s.max_players },
                    (_, i) => i < s.players_count,
                  );
                  return (
                    <div
                      key={s.room_code}
                      className={`ml-server${full ? " ml-server--full" : ""}`}
                      onClick={() => !full && navigate(`/games/${s.room_code}`)}
                    >
                      <div className="ml-server-top">
                        <div className="ml-server-left">
                          <span
                            className={`ml-server-dot${full ? " ml-server-dot--full" : ""}`}
                          />
                          <span className="ml-server-code">{s.room_code}</span>
                        </div>
                        <div className="ml-server-top-right">
                          <span
                            className={`ml-server-status${full ? " ml-server-status--full" : ""}`}
                          >
                            {full ? "FULL" : "PLAY"}
                          </span>
                          {isOwn && (
                            <button
                              className="ml-server-delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteServer(s.room_code);
                              }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="ml-server-bottom">
                        <span className="ml-server-host">@{s.host}</span>
                        <div className="ml-server-slots">
                          {slots.map((filled, i) => (
                            <span
                              key={i}
                              className={`ml-slot${filled ? " ml-slot--filled" : ""}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="ml-divider" />

          <div className="ml-section">
            <p className="ml-eyebrow">// Создать игру</p>
            <div className="ml-create">
              <div className="ml-create-row">
                <span className="ml-create-key">Игроков</span>
                <div className="ml-stepper">
                  <button
                    className="ml-stepper-btn"
                    onClick={() => setMaxPlayers((p) => Math.max(2, p - 1))}
                  >
                    −
                  </button>
                  <span className="ml-stepper-val">{maxPlayers}</span>
                  <button
                    className="ml-stepper-btn"
                    onClick={() => setMaxPlayers((p) => Math.min(8, p + 1))}
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                className="ml-create-btn"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? "Создание..." : "Создать комнату"}
              </button>
              {createError && <p className="ml-create-error">{createError}</p>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
