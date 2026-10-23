import { useCart } from "../../context/CartContext";
import Icon from "../common/Icon/Icon";
import "./StockNotice.css";

// Aviso de "actualizamos tu carrito": aparece cuando syncStock tuvo que bajar
// cantidades o quitar productos porque cambio su stock.
export default function StockNotice() {
  const { stockNotices, dismissStockNotices } = useCart();

  if (stockNotices.length === 0) return null;

  return (
    <div className="stock-notice" role="status">
      <span className="stock-notice-icon">
        <Icon name="alertCircle" size={20} />
      </span>
      <div className="stock-notice-body">
        <strong>Actualizamos tu carrito</strong>
        <ul>
          {stockNotices.map((notice) => (
            <li key={notice}>{notice}</li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        className="stock-notice-close"
        onClick={dismissStockNotices}
        aria-label="Cerrar aviso"
      >
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}
