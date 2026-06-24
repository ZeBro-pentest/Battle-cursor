import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { marketAPI, userAPI } from "../../services/api";
import { setShop, setInventory } from "../../store/marketSlice";
import type { RootState } from "../../store/store";
import type { Cursor, Canvas } from "../../types/user";
import "./Shop.css";

const RARITY_COLOR: Record<string, string> = {
  common: "#888",
  rare: "#4488ff",
  epic: "#aa44ee",
  mythic: "#FF0606",
  legendary: "#ffcc00",
};

type Tab = "cursors" | "canvases";

export function Shop() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    cursors,
    canvases,
    ownedCursorIds,
    ownedCanvasIds,
    shopLoaded,
    inventoryLoaded,
  } = useSelector((s: RootState) => s.market);

  const [tab, setTab] = useState<Tab>("cursors");
  const [coins, setCoins] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    document.body.classList.add("no-scrollbar");
    return () => document.body.classList.remove("no-scrollbar");
  }, []);

  useEffect(() => {
    const loads: Promise<void>[] = [];
    if (!shopLoaded) {
      loads.push(
        marketAPI
          .getShop()
          .then((r) => {
            dispatch(setShop({ cursors: r.data.cursors, canvases: r.data.canvases }));
          }),
      );
    }
    if (!inventoryLoaded) {
      loads.push(
        marketAPI.getInventory().then((r) => {
          dispatch(setInventory({
            cursorIds: r.data.cursors.map((c: Cursor) => c.id),
            canvasIds: r.data.canvases.map((c: Canvas) => c.id),
          }));
        }),
      );
    }
    const all = [
      ...loads,
      userAPI.getProfile().then((r) => setCoins(r.data.coins)),
    ];
    Promise.all(all).catch(() => setFetchError("Не удалось загрузить магазин"));
  }, []);

  if (fetchError) return <div className="shop-error">{fetchError}</div>;
  if (!shopLoaded || !inventoryLoaded)
    return <div className="shop-loading">Загрузка...</div>;

  const items = tab === "cursors" ? cursors : canvases;
  const ownedIds = tab === "cursors" ? ownedCursorIds : ownedCanvasIds;

  return (
    <div className="shop-page">
      <div className="shop-wrap">
        <div className="shop-top-row">
          <div className="shop-header">
            <p className="shop-label">Магазин</p>
            <h1 className="shop-title">SHOP</h1>
          </div>
          {coins !== null && (
            <div className="shop-balance">
              <span className="shop-balance-value">{coins}</span>
              <span className="shop-balance-label">Balance</span>
            </div>
          )}
        </div>

        <div className="shop-rule" />

        <div className="shop-tabs">
          <button
            className={`shop-tab${tab === "cursors" ? " active" : ""}`}
            onClick={() => setTab("cursors")}
          >
            Курсоры
          </button>
          <button
            className={`shop-tab${tab === "canvases" ? " active" : ""}`}
            onClick={() => setTab("canvases")}
          >
            Канвасы
          </button>
        </div>

        <div className="shop-grid">
          {items.map((item) => {
            const owned = ownedIds.includes(item.id);
            const rarityColor = RARITY_COLOR[item.rarity] ?? "";
            const detailPath =
              tab === "cursors"
                ? `/shop/cursors/${item.id}`
                : `/shop/canvases/${item.id}`;

            return (
              <div
                key={item.id}
                className={`shop-card${owned ? " shop-card--owned" : ""}`}
                style={{ "--card-color": owned ? "#1a1a1a" : rarityColor || "#1a1a1a" } as any}
                onClick={() => navigate(detailPath)}
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="shop-card-img"
                  />
                ) : (
                  <div className="shop-card-img-placeholder" />
                )}

                {rarityColor && (
                  <p
                    className="shop-card-rarity"
                    style={{ color: rarityColor }}
                  >
                    {item.rarity}
                  </p>
                )}

                <p className="shop-card-name">{item.name}</p>
                {owned ? (
                  <span className="shop-card-owned">В инвентаре</span>
                ) : (
                  <span className="shop-card-more">Подробнее →</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
