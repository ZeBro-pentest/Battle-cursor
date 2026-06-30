import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { userAPI } from "../../services/api";
import type { UserProfile } from "../../types/user";
import "./Profile.css";

const RARITY_COLOR: Record<string, string> = {
  common:    "#666",
  rare:      "#4488ff",
  epic:      "#aa44ee",
  mythic:    "#FF0606",
  legendary: "#ffcc00",
};

export function ProfileDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    userAPI.getProfileById(id)
      .then((res) => setProfile(res.data))
      .catch((err) => setError(
        err.response?.status === 404 ? "Пользователь не найден" : "Не удалось загрузить профиль"
      ))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="profile-loading">Загрузка...</div>;
  if (error || !profile) return <div className="profile-error">{error || "Ошибка"}</div>;

  return (
    <div className="profile-page">
      <div className="profile-grid">

        {/* ── Left: info + equipment ── */}
        <aside className="profile-col profile-col--left">
          <p className="profile-col-label">// Игрок</p>
          <div className="profile-info">
            <h1 className="profile-username">{profile.username}</h1>
            <div className="profile-stats">
              <div className="profile-stat">
                <span className="profile-stat-value">{profile.rating}</span>
                <span className="profile-stat-label">Рейтинг</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-value profile-stat-value--coins">{profile.coins}</span>
                <span className="profile-stat-label">Монеты</span>
              </div>
            </div>
            <p className="profile-email">{profile.email}</p>
            <button className="profile-btn profile-btn--ghost" onClick={() => navigate(-1)}>
              ← Назад
            </button>
          </div>

          <p className="profile-col-label">// Снаряжение</p>
          <EquipCard
            type="Курсор"
            name={profile.cursor?.name}
            imageUrl={profile.cursor?.image_url}
            rarity={profile.cursor?.rarity}
          />
          <EquipCard
            type="Холст"
            name={profile.canvas?.name}
            imageUrl={profile.canvas?.image_url}
            rarity={profile.canvas?.rarity}
          />
        </aside>

        {/* ── Center: drawing ── */}
        <main className="profile-col profile-col--center">
          {profile.profile_drawing_url ? (
            <div className="profile-detail-drawing">
              <p className="profile-col-label">// Рисунок игрока</p>
              <img
                src={profile.profile_drawing_url}
                alt="Рисунок"
                className="profile-detail-drawing-img"
              />
            </div>
          ) : (
            <p className="profile-col-label" style={{ opacity: 0.3 }}>// Нет сохранённого рисунка</p>
          )}
        </main>

        {/* ── Right: empty ── */}
        <aside className="profile-col" />

      </div>
    </div>
  );
}

function EquipCard({ type, name, imageUrl, rarity }: {
  type: string; name?: string; imageUrl?: string | null; rarity?: string;
}) {
  const color = rarity && rarity !== "null" ? (RARITY_COLOR[rarity] ?? "") : "";

  return (
    <div className="equip-card" style={{ "--equip-color": color || "transparent" } as React.CSSProperties}>
      <div className="equip-card-glow" />
      {imageUrl
        ? <img src={imageUrl} alt={name} className="equip-img" />
        : <div className="equip-img-placeholder" />
      }
      <p className="equip-type">{type}</p>
      <p className="equip-name">{name ?? "Не выбран"}</p>
      {color && <p className="equip-rarity" style={{ color }}>{rarity}</p>}
    </div>
  );
}
