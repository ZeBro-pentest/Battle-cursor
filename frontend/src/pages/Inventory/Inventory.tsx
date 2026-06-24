import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { marketAPI, userAPI } from "../../services/api";
import type { Inventory as InventoryType, UserProfile } from "../../types/user";
import "./Inventory.css";

type Tab = "cursors" | "canvases";

export function Inventory() {
  const [inventory, setInventory] = useState<InventoryType | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tab, setTab] = useState<Tab>("cursors");

  const [selectedCursor, setSelectedCursor] = useState<string | null>(null);
  const [selectedCanvas, setSelectedCanvas] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveErr, setSaveErr] = useState("");
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    Promise.all([marketAPI.getInventory(), userAPI.getProfile()])
      .then(([invRes, profRes]) => {
        setInventory(invRes.data);
        const p: UserProfile = profRes.data;
        setProfile(p);
        setSelectedCursor(p.cursor?.id ?? null);
        setSelectedCanvas(p.canvas?.id ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg("");
    setSaveErr("");
    try {
      await userAPI.updateProfile({ cursor: selectedCursor, canvas: selectedCanvas });
      setSaveMsg("Сохранено");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err: any) {
      const d = err.response?.data;
      setSaveErr(d?.detail || d?.cursor?.[0] || d?.canvas?.[0] || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="shop-loading">Загрузка...</div>;
  if (!inventory || !profile) return <div className="shop-error">Ошибка загрузки</div>;

  const cursors = inventory.cursors;
  const canvases = inventory.canvases;

  return (
    <div className="shop-page">
      <div className="shop-wrap">

        <div className="shop-top-row" style={{ marginBottom: 6 }}>
          <div className="shop-header">
            <p className="shop-label">Мой инвентарь</p>
            <h1 className="shop-title">ИНВЕНТАРЬ</h1>
          </div>
          <Link to="/purchases" className="detail-back" style={{ alignSelf: "flex-end", marginBottom: 8 }}>
            История покупок →
          </Link>
        </div>

        <div className="shop-rule" />

        <div className="inv-tabs-row">
          <div className="shop-tabs">
            <button className={`shop-tab${tab === "cursors" ? " active" : ""}`} onClick={() => setTab("cursors")}>
              Курсоры ({cursors.length})
            </button>
            <button className={`shop-tab${tab === "canvases" ? " active" : ""}`} onClick={() => setTab("canvases")}>
              Холсты ({canvases.length})
            </button>
          </div>
          <div className="inv-save-row">
            <button className="profile-btn" onClick={handleSave} disabled={saving}>
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
            {saveMsg && <span className="inv-save-msg">{saveMsg}</span>}
            {saveErr && <span className="inv-save-err">{saveErr}</span>}
          </div>
        </div>

        {tab === "cursors" && (
          cursors.length === 0
            ? <p className="inv-empty">Нет курсоров в инвентаре</p>
            : (
              <div className="inv-grid-scroll">
                <div className="shop-grid">
                  <NoneCard selected={selectedCursor === null} onClick={() => setSelectedCursor(null)} />
                  {cursors.map((c) => (
                    <InvCard
                      key={c.id} name={c.name} imageUrl={c.image_url}
                      equipped={selectedCursor === c.id} onClick={() => setSelectedCursor(c.id)}
                    />
                  ))}
                </div>
              </div>
            )
        )}

        {tab === "canvases" && (
          canvases.length === 0
            ? <p className="inv-empty">Нет холстов в инвентаре</p>
            : (
              <div className="inv-grid-scroll">
                <div className="shop-grid">
                  <NoneCard selected={selectedCanvas === null} onClick={() => setSelectedCanvas(null)} />
                  {canvases.map((c) => (
                    <InvCard
                      key={c.id} name={c.name} imageUrl={c.image_url}
                      equipped={selectedCanvas === c.id} onClick={() => setSelectedCanvas(c.id)}
                    />
                  ))}
                </div>
              </div>
            )
        )}

      </div>
    </div>
  );
}

function NoneCard({ selected, onClick }: { selected: boolean; onClick: () => void }) {
  return (
    <div className={`inv-card${selected ? " equipped" : ""}`} onClick={onClick}>
      <div className="inv-card-img-placeholder" />
      <p className="inv-card-name">Снять</p>
      <span className={`inv-card-badge${selected ? " on" : " off"}`}>
        {selected ? "Надет" : "—"}
      </span>
    </div>
  );
}

function InvCard({ name, imageUrl, equipped, onClick }: {
  name: string; imageUrl: string | null; equipped: boolean; onClick: () => void;
}) {
  return (
    <div className={`inv-card${equipped ? " equipped" : ""}`} onClick={onClick}>
      {imageUrl
        ? <img src={imageUrl} alt={name} className="inv-card-img" />
        : <div className="inv-card-img-placeholder" />
      }
      <p className="inv-card-name">{name}</p>
      <span className={`inv-card-badge${equipped ? " on" : " off"}`}>
        {equipped ? "Надет" : "Надеть"}
      </span>
    </div>
  );
}
