import { useEffect } from "react";
import { useCart } from "../../context/CartContext";
import Button from "../common/Button";
import Icon from "../common/Icon/Icon";
import StockNotice from "./StockNotice";
import "./CartView.css";

export default function CartView() {
  const { cartItems, removeFromCart, updateQuantity, syncStock } = useCart();

  // Al abrir el carrito (o el checkout) se revisa el stock real de cada
  // producto: si alguien compro mientras tanto, las cantidades se ajustan aqui
  // y no al momento de pagar.
  useEffect(() => {
    syncStock();
  }, [syncStock]);

  return (
    <div className="cart-view">
      <div className="cart-view-header">
        <h2>
          {cartItems.length} {cartItems.length === 1 ? "artículo" : "artículos"}
        </h2>
      </div>

      <StockNotice />

      {cartItems &&
        cartItems.map((item) => {
          const stock = Number.isFinite(item.stock) ? item.stock : Infinity;
          const isMax = item.quantity >= stock;

          return (
            <div className="cart-item" key={item._id}>
              <div className="cart-item-image">
                <img
                  src={item.imagesUrl?.[0] || "/img/products/placeholder.svg"}
                  alt={item.name}
                  loading="lazy"
                  onError={(event) => {
                    event.target.src = "/img/products/placeholder.svg";
                  }}
                />
              </div>

              <div className="cart-item-info">
                <h3>{item.name}</h3>
                <p className="cart-item-price">{`$${item.price.toFixed(2)}`}</p>
                {isMax ? (
                  <p className="cart-item-stock is-max">
                    Máximo disponible: {stock}
                  </p>
                ) : (
                  stock <= 5 && (
                    <p className="cart-item-stock">
                      ¡{stock === 1 ? "Queda" : "Quedan"} {stock}!
                    </p>
                  )
                )}
              </div>

              <div className="cart-item-quantity">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => updateQuantity(item._id, item.quantity - 1)}
                >
                  <Icon name="minus" size={15}></Icon>
                </Button>
                <span>{item.quantity}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => updateQuantity(item._id, item.quantity + 1)}
                  disabled={isMax}
                  title={
                    isMax
                      ? `Solo hay ${stock} ${stock === 1 ? "disponible" : "disponibles"}`
                      : "Agregar una unidad"
                  }
                >
                  <Icon name="plus" size={15}></Icon>
                </Button>
              </div>

              <div className="cart-item-total">
                ${(item.price * item.quantity).toFixed(2)}
              </div>

              <Button
                variant="ghost"
                className="danger"
                size="sm"
                onClick={() => removeFromCart(item._id)}
                title="Eliminar artículo"
              >
                <Icon name="trash" size={16} />
              </Button>
            </div>
          );
        })}
    </div>
  );
}
