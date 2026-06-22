import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

export function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    userAPI.getProfile()
      .then((res) => setProfile(res.data))
      .catch(() => setError("Не удалось загрузить профиль"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="profile-loading">Загрузка...</div>;
  if (error || !profile) return <div className="profile-error">{error || "Ошибка"}</div>;

  return (
    <div className="profile-page">
      <div className="profile-wrap">

        {/* ── Top: name + edit button ── */}
        <div className="profile-top">
          <div>
            <p className="profile-player-label">Игрок</p>
            <h1 className="profile-username">{profile.username}</h1>
          </div>
          <Link to="/inventory" className="profile-btn" style={{ marginTop: 8 }}>
            Редактировать
          </Link>
        </div>

        <div className="profile-rule" />

        {/* ── Stats ── */}
        <div className="profile-stats">
          <div className="profile-stat">
            <span className="profile-stat-value">{profile.rating}</span>
            <span className="profile-stat-label">Рейтинг</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-value">{profile.coins}</span>
            <span className="profile-stat-label">Монеты</span>
          </div>
        </div>

        <p className="profile-email">{profile.email}</p>

        <div className="profile-divider" />

        {/* ── Equipment ── */}
        <p className="equip-heading">Снаряжение</p>
        <div className="equip-grid">
          {!profile.cursor && !profile.canvas ? (
            <p className="equip-empty">Снаряжение не выбрано</p>
          ) : (
            <>
              <EquipCard type="Курсор" name={profile.cursor?.name} imageUrl={profile.cursor?.image_url} rarity={profile.cursor?.rarity} />
              <EquipCard type="Канвас" name={profile.canvas?.name} imageUrl={profile.canvas?.image_url} rarity={profile.canvas?.rarity} />
            </>
          )}
        </div>

      </div>
    </div>
  );
}

function EquipCard({ type, name, imageUrl, rarity }: {
  type: string; name?: string; imageUrl?: string | null; rarity?: string;
}) {
  const color = rarity && rarity !== "null" ? (RARITY_COLOR[rarity] ?? "") : "";

  return (
    <div className="equip-card" style={{ "--equip-color": color || "transparent" } as any}>
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
