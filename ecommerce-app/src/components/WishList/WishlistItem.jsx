import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import {
  flyToCart,
  prefersReducedMotion,
  waitForAnimation,
} from "../../utils/flyToCart";
import Badge from "../common/Badge";
import Button from "../common/Button";
import Icon from "../common/Icon/Icon";
import "./WishlistItem.css";

const PLACEHOLDER = "/img/products/placeholder.svg";

const formatMoney = (value = 0) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);

// Pliega la fila (se desvanece, se encoge y cierra el hueco de la lista) para
// que los demas productos suban con suavidad antes de quitarla del estado.
function collapseRow(row, delay = 0) {
  if (!row || prefersReducedMotion()) return Promise.resolve();

  const style = getComputedStyle(row);
  const gap = parseFloat(getComputedStyle(row.parentElement).rowGap) || 0;
  const open = {
    height: `${row.offsetHeight}px`,
    paddingTop: style.paddingTop,
    paddingBottom: style.paddingBottom,
    borderTopWidth: style.borderTopWidth,
    borderBottomWidth: style.borderBottomWidth,
    marginBottom: "0px",
  };
  const closed = {
    height: "0px",
    paddingTop: "0px",
    paddingBottom: "0px",
    borderTopWidth: "0px",
    borderBottomWidth: "0px",
    marginBottom: `${-gap}px`,
  };

  const animation = row.animate(
    [
      { ...open, opacity: 1, transform: "scale(1)" },
      { ...open, opacity: 0, transform: "scale(0.97)", offset: 0.45 },
      { ...closed, opacity: 0, transform: "scale(0.97)" },
    ],
    { duration: 650, delay, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" }
  );
  return waitForAnimation(animation, delay + 1150);
}

export default function WishlistItem({ product, onMovedToCart }) {
  const { cartItems, addToCart } = useCart();
  const { removeFromWishlist } = useWishlist();
  // null | "moving" (vuela al carrito) | "removing" (se quito con el boton)
  const [leaving, setLeaving] = useState(null);
  const rowRef = useRef(null);
  const imageRef = useRef(null);

  const inStock = product.stock > 0;
  const cartItem = cartItems.find((item) => item._id === product._id);
  // Si ya estan en el carrito todas las unidades disponibles, no se puede mover
  const isMaxedOut = inStock && (cartItem?.quantity ?? 0) >= product.stock;
  const productLink = `/product/${product._id}`;

  // Del corazon al carrito: la foto vuela al Header; al aterrizar se suma al
  // carrito y, cuando la fila termina de plegarse, sale de la wishlist.
  const handleMoveToCart = async () => {
    setLeaving("moving");
    const landing = flyToCart(imageRef.current);
    const collapse = collapseRow(rowRef.current, 300);

    await landing;
    addToCart(product, 1);
    await collapse;
    removeFromWishlist(product._id);
    onMovedToCart?.(product);
  };

  const handleRemove = async () => {
    setLeaving("removing");
    await collapseRow(rowRef.current);
    removeFromWishlist(product._id);
  };

  return (
    <li
      ref={rowRef}
      className={`wishlist-item${leaving ? " is-leaving" : ""}`}
    >
      <Link to={productLink} className="wishlist-item-image">
        <img
          ref={imageRef}
          src={product.imagesUrl?.[0] || PLACEHOLDER}
          alt={product.name}
          loading="lazy"
          onError={(event) => {
            event.target.src = PLACEHOLDER;
          }}
        />
      </Link>

      <div className="wishlist-item-info">
        <h3>
          <Link to={productLink}>{product.name}</Link>
        </h3>
        <p className="wishlist-item-price">{formatMoney(product.price)}</p>
        <div className="wishlist-item-meta">
          <Badge
            text={inStock ? "En stock" : "Agotado"}
            variant={inStock ? "success" : "error"}
          />
          {cartItem && (
            <span className="muted">En tu carrito: {cartItem.quantity}</span>
          )}
        </div>
      </div>

      <div className="wishlist-item-actions">
        <Button
          onClick={handleMoveToCart}
          disabled={!inStock || isMaxedOut || Boolean(leaving)}
          title={
            !inStock
              ? "Producto agotado"
              : isMaxedOut
                ? product.stock === 1
                  ? "Ya tienes en tu carrito la única unidad disponible"
                  : `Ya tienes en tu carrito las ${product.stock} unidades disponibles`
                : "Agregar al carrito (sale de tus favoritos)"
          }
        >
          <Icon name="cart" size={16} />
          <span>
            {leaving === "moving"
              ? "¡Va al carrito!"
              : isMaxedOut
                ? "Máximo en carrito"
                : "Agregar al carrito"}
          </span>
        </Button>
        <Button
          variant="secondary"
          onClick={handleRemove}
          disabled={Boolean(leaving)}
          title="Quitar de favoritos"
        >
          <Icon name="trash" size={16} />
          <span>Quitar</span>
        </Button>
      </div>
    </li>
  );
}
