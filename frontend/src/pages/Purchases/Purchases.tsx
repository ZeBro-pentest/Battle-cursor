import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { marketAPI } from "../../services/api";
import { setShop } from "../../store/marketSlice";
import type { RootState } from "../../store/store";
import "./Purchases.css";

interface Purchase {
  id: string;
  item_type: "cursor" | "canvas";
  item_id: string;
  price_paid: number;
  bought_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function Purchases() {
  const dispatch = useDispatch();
  const { cursors, canvases, shopLoaded } = useSelector((s: RootState) => s.market);

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    const loads: Promise<void>[] = [
      marketAPI.getPurchases().then((r) => setPurchases(r.data)),
    ];
    if (!shopLoaded) {
      loads.push(marketAPI.getShop().then((r) => {
        dispatch(setShop({ cursors: r.data.cursors, canvases: r.data.canvases }));
      }));
    }
    Promise.all(loads)
      .catch(() => setError("Не удалось загрузить историю"))
      .finally(() => setLoading(false));
  }, []);

  const findItem = (type: "cursor" | "canvas", id: string) => {
    if (type === "cursor") return cursors.find((c) => c.id === id);
    return canvases.find((c) => c.id === id);
  };

  if (loading) return <div className="shop-loading">Загрузка...</div>;
  if (error)   return <div className="shop-error">{error}</div>;

  return (
    <div className="shop-page">
      <div className="shop-wrap">

        <div className="detail-topbar">
          <Link to="/inventory" className="detail-back">← Инвентарь</Link>
        </div>

        <div className="shop-header" style={{ marginBottom: 6 }}>
          <p className="shop-label">История</p>
          <h1 className="shop-title">ПОКУПКИ</h1>
        </div>

        <div className="shop-rule" />

        {purchases.length === 0 ? (
          <p className="purchases-empty">Покупок пока нет</p>
        ) : (
          <div className="purchases-list">
            {purchases.map((p) => {
              const item = findItem(p.item_type, p.item_id);
              return (
                <div key={p.id} className="purchase-row">
                  {item?.image_url
                    ? <img src={item.image_url} alt={item.name} className="purchase-img" />
                    : <div className="purchase-img-placeholder" />
                  }

                  <div className="purchase-info">
                    <p className="purchase-name">
                      {item?.name ?? p.item_id}
                    </p>
                    <p className="purchase-meta">{formatDate(p.bought_at)}</p>
                  </div>

                  <span className="purchase-type">
                    {p.item_type === "cursor" ? "Курсор" : "Канвас"}
                  </span>

                  <div className="purchase-price">
                    {p.price_paid}
                    <small>монет</small>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
