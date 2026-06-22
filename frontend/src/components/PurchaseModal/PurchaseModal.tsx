import { useNavigate } from "react-router-dom";
import "./PurchaseModal.css";

interface Props {
  itemName: string;
  imageUrl: string | null;
  onClose: () => void;
}

export function PurchaseModal({ itemName, imageUrl, onClose }: Props) {
  const navigate = useNavigate();

  const handleInventory = () => {
    onClose();
    navigate("/inventory");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-check">✓</div>

        <h2 className="modal-title">Покупка совершена</h2>

        {imageUrl
          ? <img src={imageUrl} alt={itemName} className="modal-img" />
          : <div className="modal-img-placeholder" />
        }

        <p className="modal-item-name">{itemName}</p>

        <div className="modal-divider" />

        <div className="modal-actions">
          <button className="modal-btn-primary" onClick={handleInventory}>
            Перейти в инвентарь
          </button>
          <button className="modal-btn-ghost" onClick={onClose}>
            Продолжить покупки
          </button>
        </div>
      </div>
    </div>
  );
}
