import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { marketAPI, userAPI } from "../../services/api";
import { setShop, setInventory, addOwned } from "../../store/marketSlice";
import type { RootState } from "../../store/store";
import type { Cursor, Canvas } from "../../types/user";
import { PurchaseModal } from "../../components/PurchaseModal/PurchaseModal";
import { DEBUFF_MAP, DEBUFF_RARITY_COLOR } from "../../constants/debuffs";
import "./Shop.css";

const RARITY_COLOR: Record<string, string> = {
  common:    "#888",
  rare:      "#4488ff",
  epic:      "#aa44ee",
  mythic:    "#FF0606",
  legendary: "#ffcc00",
};

const RARITY_LABEL: Record<string, string> = {
  null:      "—",
  common:    "Common",
  rare:      "Rare",
  epic:      "Epic",
  mythic:    "Mythic",
  legendary: "Legendary",
};

interface Props { type: "cursor" | "canvas"; }

export function ShopItemDetail({ type }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { cursors, canvases, ownedCursorIds, ownedCanvasIds, shopLoaded, inventoryLoaded } =
    useSelector((s: RootState) => s.market);

  const [buying, setBuying] = useState(false);
  const [buyErr, setBuyErr] = useState("");
  const [coins, setCoins] = useState<number | null>(null);
  const [purchased, setPurchased] = useState(false);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const loads: Promise<void>[] = [];
    if (!shopLoaded) {
      loads.push(marketAPI.getShop().then((r) => {
        dispatch(setShop({ cursors: r.data.cursors, canvases: r.data.canvases }));
      }));
    }
    if (!inventoryLoaded) {
      loads.push(marketAPI.getInventory().then((r) => {
        dispatch(setInventory({
          cursorIds: r.data.cursors.map((c: Cursor) => c.id),
          canvasIds: r.data.canvases.map((c: Canvas) => c.id),
        }));
      }));
    }
    const all = [...loads, userAPI.getProfile().then((r) => setCoins(r.data.coins))];
    Promise.all(all).catch(() => {});
  }, []);

  if (!shopLoaded || !inventoryLoaded) return <div className="shop-loading">Загрузка...</div>;

  const items = type === "cursor" ? cursors : canvases;
  const item = items.find((i) => i.id === id);
  if (!item) return <div className="shop-error">Предмет не найден</div>;

  const owned = type === "cursor"
    ? ownedCursorIds.includes(item.id)
    : ownedCanvasIds.includes(item.id);

  const rarityColor = RARITY_COLOR[item.rarity] ?? "";
  const tags: string[] = type === "cursor"
    ? (item as Cursor).debuffs
    : (item as Canvas).protections;

  const tagColor = type === "cursor"
    ? "rgba(255, 6, 6, 0.35)"
    : "rgba(68, 187, 68, 0.35)";

  const handleBuy = async () => {
    setBuying(true);
    setBuyErr("");
    try {
      await marketAPI.buy(item.id, type);
      dispatch(addOwned({ itemType: type, id: item.id }));
      if (coins !== null) setCoins(coins - item.price);
      setPurchased(true);
    } catch (err: any) {
      setBuyErr(err.response?.data?.detail || "Ошибка покупки");
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="shop-page">
      {purchased && (
        <PurchaseModal
          itemName={item.name}
          imageUrl={item.image_url}
          onClose={() => setPurchased(false)}
        />
      )}
      <div className="shop-wrap">

        <div className="detail-topbar">
          <button className="detail-back" onClick={() => navigate("/shop")}>
            ← Магазин
          </button>
          {coins !== null && (
            <div className="shop-balance">
              <span className="shop-balance-value">{coins}</span>
              <span className="shop-balance-label">монет</span>
            </div>
          )}
        </div>

        <div className="detail-hero">
          {/* ── Image ── */}
          <div className="detail-img-wrap" style={{ "--detail-color": rarityColor || "transparent" } as any}>
            {item.image_url
              ? <img src={item.image_url} alt={item.name} className="detail-img" />
              : <div className="detail-img-placeholder" />
            }
          </div>

          {/* ── Info ── */}
          <div className="detail-info">
            {rarityColor && (
              <span className="detail-rarity-badge" style={{ color: rarityColor, borderColor: rarityColor }}>
                {RARITY_LABEL[item.rarity] ?? item.rarity}
              </span>
            )}

            <h1 className="detail-name">{item.name}</h1>

            {/* ── Stats grid ── */}
            <div className="detail-stats">
              <div className="detail-stat-row">
                <span className="detail-stat-key">Тип</span>
                <span className="detail-stat-val">{type === "cursor" ? "Курсор" : "Канвас"}</span>
              </div>
              <div className="detail-stat-row">
                <span className="detail-stat-key">Цена</span>
                <span className="detail-stat-val" style={{ color: "#ffcc00" }}>{item.price} монет</span>
              </div>
              <div className="detail-stat-row">
                <span className="detail-stat-key">{type === "cursor" ? "Дебаффов" : "Защит"}</span>
                <span className="detail-stat-val">{tags.length}</span>
              </div>
            </div>

            {/* ── Buy ── */}
            <div className="detail-buy-section">
              <button
                className={`detail-buy-btn${owned ? " owned" : ""}`}
                disabled={owned || buying}
                onClick={handleBuy}
              >
                {buying ? "Покупка..." : owned ? "В инвентаре" : "Купить"}
              </button>
              {buyErr && <p className="detail-buy-err">{buyErr}</p>}
            </div>
          </div>
        </div>

        <div className="detail-divider" />

        {/* ── Traits ── */}
        <p className="detail-section-label">
          {type === "cursor" ? "Дебаффы курсора" : "Защиты канваса"}
        </p>

        {tags.length > 0 ? (
          <div className="detail-debuff-slider">
            {tags.map((id, i) => {
              const info = DEBUFF_MAP[id];
              const rarityColor = info ? DEBUFF_RARITY_COLOR[info.rarity] : tagColor;
              return (
                <div key={i} className="detail-debuff-card" style={{ borderTopColor: rarityColor }}>
                  <span className="detail-debuff-rarity" style={{ color: rarityColor }}>
                    {info?.rarity ?? "—"}
                  </span>
                  <span className="detail-debuff-name">{info?.name ?? id}</span>
                  {info && <p className="detail-debuff-desc">{info.description}</p>}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="detail-tags-empty">Нет</p>
        )}

      </div>
    </div>
  );
}
