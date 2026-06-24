import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { HexColorPicker } from "react-colorful";
import { userAPI } from "../../services/api";
import type { UserProfile } from "../../types/user";
import "./Profile.css";

const RARITY_COLOR: Record<string, string> = {
  common: "#aaa",
  rare: "#4488ff",
  epic: "#aa44ee",
  mythic: "#FF0606",
  legendary: "#ffcc00",
};

const PALETTE = [
  "#000000",
  "#808080",
  "#8b4513",
  "#ffffff",
  "#ff69b4",
  "#9b59b6",
  "#006400",
  "#8b0000",
  "#ff0000",
  "#ff8c00",
  "#ffff00",
  "#00cc00",
  "#87ceeb",
  "#0000ff",
  "#8b00ff",
  "#00ffff",
];

const MAX_HISTORY = 20;

export function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorImgRef = useRef<HTMLImageElement>(null);
  const colorPickerPopupRef = useRef<HTMLDivElement>(null);
  const colorPreviewRef = useRef<HTMLDivElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
  const isDrawing = useRef(false);
  const historyRef = useRef<ImageData[]>([]);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    userAPI
      .getProfile()
      .then((res) => setProfile(res.data))
      .catch(() => setError("Не удалось загрузить профиль"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !profile) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [profile]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ") {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx || historyRef.current.length === 0) return;
        ctx.putImageData(historyRef.current.pop()!, 0, 0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!showColorPicker) return;
    const onDown = (e: MouseEvent) => {
      if (colorPickerPopupRef.current && !colorPickerPopupRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showColorPicker]);

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (historyRef.current.length >= MAX_HISTORY) historyRef.current.shift();
    historyRef.current.push(
      ctx.getImageData(0, 0, canvas.width, canvas.height),
    );
  };

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    saveHistory();
    isDrawing.current = true;
    const size = isEraser ? brushSize * 3 : brushSize;
    const { x, y } = getPos(e);
    ctx.globalCompositeOperation = isEraser ? "destination-out" : "source-over";
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = isEraser ? "rgba(255,255,255,1)" : color;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const onCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (cursorImgRef.current) {
      cursorImgRef.current.style.left = `${e.clientX}px`;
      cursorImgRef.current.style.top = `${e.clientY}px`;
    }
    onMouseMove(e);
  };

  const onCanvasEnter = () => {
    if (cursorImgRef.current) cursorImgRef.current.style.visibility = "visible";
  };

  const onCanvasLeave = () => {
    if (cursorImgRef.current) cursorImgRef.current.style.visibility = "hidden";
    onMouseUp();
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = isEraser ? brushSize * 3 : brushSize;
    const { x, y } = getPos(e);
    ctx.globalCompositeOperation = isEraser ? "destination-out" : "source-over";
    ctx.lineTo(x, y);
    ctx.strokeStyle = isEraser ? "rgba(255,255,255,1)" : color;
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const onMouseUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.globalCompositeOperation = "source-over";
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    saveHistory();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  if (loading) return <div className="profile-loading">Загрузка...</div>;
  if (error || !profile)
    return <div className="profile-error">{error || "Ошибка"}</div>;

  const canvasRarity = profile.canvas?.rarity;

  const cursorColor =
    profile.cursor?.rarity && profile.cursor.rarity !== "null"
      ? (RARITY_COLOR[profile.cursor.rarity] ?? "")
      : "";
  const canvasColor =
    canvasRarity && canvasRarity !== "null"
      ? (RARITY_COLOR[canvasRarity] ?? "")
      : "";

  return (
    <div className="profile-page">
      <div className="profile-grid">
        {/* ── Left: Profile info + Equipment ── */}
        <aside className="profile-col profile-col--left">
          <div className="profile-info">
            <h1 className="profile-username">{profile.username}</h1>
            <div className="profile-stats">
              <div className="profile-stat">
                <span className="profile-stat-value">{profile.rating}</span>
                <span className="profile-stat-label">Рейтинг</span>
              </div>
              <div className="profile-stat-sep" />
              <div className="profile-stat">
                <span className="profile-stat-value profile-stat-value--coins">
                  {profile.coins}
                </span>
                <span className="profile-stat-label">Монеты</span>
              </div>
            </div>
            <p className="profile-email">{profile.email}</p>
            <Link to="/inventory" className="profile-btn">
              Редактировать
            </Link>
          </div>
          <p className="profile-col-label">// Снаряжение</p>
          <EquipCard
            type="Курсор"
            name={profile.cursor?.name}
            imageUrl={profile.cursor?.image_url}
            rarity={profile.cursor?.rarity}
            color={cursorColor}
          />
          <EquipCard
            type="Холст"
            name={profile.canvas?.name}
            imageUrl={profile.canvas?.image_url}
            rarity={profile.canvas?.rarity}
            color={canvasColor}
          />
        </aside>

        {/* ── Center: Canvas ── */}
        <main className="profile-col profile-col--center">
          <div className="profile-canvas-wrap">
            <div className="canvas-wrapper">
              {profile.canvas?.image_url && (
                <img
                  src={profile.canvas.image_url}
                  alt=""
                  className="canvas-frame-img"
                />
              )}
              <canvas
                ref={canvasRef}
                className="drawing-canvas"
                width={450}
                height={440}
                onMouseDown={onMouseDown}
                onMouseMove={onCanvasMouseMove}
                onMouseUp={onMouseUp}
                onMouseEnter={onCanvasEnter}
                onMouseLeave={onCanvasLeave}
              />
            </div>
            {profile.cursor?.name && (
              <img
                ref={cursorImgRef}
                src={`/images/cursors_orig/${profile.cursor.name}_cursor_orig.png`}
                alt=""
                className="canvas-custom-cursor"
              />
            )}
          </div>
        </main>

        {/* ── Right: Tools ── */}
        <aside className="profile-col profile-col--right">
          <p className="profile-col-label">// Инструменты</p>
          <div className="drawing-palette">
            {PALETTE.map((c) => (
              <button
                key={c}
                className={`drawing-swatch${c === color && !isEraser ? " drawing-swatch--active" : ""}`}
                style={{ background: c }}
                onClick={() => {
                  setColor(c);
                  setIsEraser(false);
                }}
                title={c}
              />
            ))}
          </div>
          <button
            className={`drawing-eraser-btn${isEraser ? " drawing-eraser-btn--active" : ""}`}
            onClick={() => setIsEraser((v) => !v)}
          >
            {isEraser ? "◈ Ластик" : "◈ Ластик"}
          </button>
          <div ref={colorPreviewRef}>
            <div
              className="drawing-color-preview"
              style={{ background: color }}
              onClick={() => {
                if (!showColorPicker && colorPreviewRef.current) {
                  const rect = colorPreviewRef.current.getBoundingClientRect();
                  setPickerPos({ top: rect.bottom + 8, left: rect.left });
                }
                setShowColorPicker((v) => !v);
              }}
              title="Выбрать цвет"
            />
          </div>
          {showColorPicker && createPortal(
            <div ref={colorPickerPopupRef} className="color-picker-popup" style={{ top: pickerPos.top, left: pickerPos.left }}>
              <HexColorPicker
                color={color}
                onChange={(c) => { setColor(c); setIsEraser(false); }}
              />
            </div>,
            document.body
          )}
          <div className="drawing-brush-row">
            <div className="drawing-brush-header">
              <span className="drawing-brush-label">Кисть</span>
              <span className="drawing-brush-val">{brushSize}px</span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="drawing-brush-range"
            />
          </div>
          <button className="drawing-clear-btn" onClick={handleClear}>
            Очистить
          </button>
          <p className="drawing-undo-hint">Ctrl+Z — отменить</p>
        </aside>
      </div>
    </div>
  );
}

function EquipCard({
  type,
  name,
  imageUrl,
  rarity,
  color,
}: {
  type: string;
  name?: string;
  imageUrl?: string | null;
  rarity?: string;
  color: string;
}) {
  return (
    <div
      className="equip-card"
      style={{ "--equip-color": color || "transparent" } as React.CSSProperties}
    >
      <div className="equip-card-glow" />
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="equip-img" />
      ) : (
        <div className="equip-img-placeholder" />
      )}
      <p className="equip-type">{type}</p>
      <p className="equip-name">{name ?? "Не выбрано"}</p>
      {color && rarity && rarity !== "null" && (
        <p className="equip-rarity" style={{ color }}>
          {rarity}
        </p>
      )}
    </div>
  );
}
