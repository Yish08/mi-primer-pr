import { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWishlist } from "../../context/WishlistContext";
import { isAuthenticated } from "../../utils/auth";
import AddToCartButton from "../common/AddToCartButton/AddToCartButton";
import Badge from "../common/Badge";
import Icon from "../common/Icon/Icon";
import "./ProductCard.css";

export default function ProductCard({
  product,
  orientation = "vertical",
  className = "",
}) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  // La foto que el carrito animado se lleva al Header
  const imageRef = useRef(null);
  const navigate = useNavigate();
  const { name, price, stock, imagesUrl, description } = product || {};

  if (!product) {
    return (
      <div
        className="product-card"
        style={{ padding: "24px", textAlign: "center" }}
      >
        <p className="muted">Producto no disponible</p>
      </div>
    );
  }

  const stockBadge =
    stock <= 0
      ? { text: "Agotado", variant: "error" }
      : stock <= 5
        ? { text: `¡${stock === 1 ? "Queda" : "Quedan"} ${stock}!`, variant: "warning" }
        : { text: "En stock", variant: "success" };
  const hasDiscount = product.discount && product.discount > 0;
  const productLink = `/product/${product._id}`;
  const cardClass = `product-card product-card--${orientation} ${className}`.trim();

  const isFavorite = isInWishlist(product._id);
  const favoriteLabel = isFavorite ? "Quitar de favoritos" : "Agregar a favoritos";
  const handleToggleWishlist = () => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }
    toggleWishlist(product);
  };

  return (
    <div className={cardClass}>
      <button
        type="button"
        className={`product-card-wishlist${isFavorite ? " is-active" : ""}`}
        onClick={handleToggleWishlist}
        aria-pressed={isFavorite}
        aria-label={favoriteLabel}
        title={favoriteLabel}
      >
        <Icon name="heart" size={20} />
      </button>
      <Link to={productLink} className="product-card-image-link">
        <img
          ref={imageRef}
          src={imagesUrl ? imagesUrl[0] : "/img/products/placeholder.svg"}
          alt={name}
          className="product-card-image"
          onError={(event) => {
            event.target.src = "/img/products/placeholder.svg";
          }}
        />
      </Link>
      <div className="product-card-content">
        <h3 className="product-card-title">
          <Link
            to={productLink}
            style={{ color: "inherit", textDecoration: "none" }}
          >
            {name}
          </Link>
        </h3>
        {description && (
          <p
            className="muted"
            style={{ fontSize: "13px", marginBottom: "8px" }}
          >
            {description.length > 60
              ? `${description.substring(0, 60)}...`
              : description}
          </p>
        )}
        <div className="product-card-price">${price}</div>
      </div>
      <div className="product-card-actions">
        <div style={{ display: "flex", gap: "8px" }}>
          <Badge text={stockBadge.text} variant={stockBadge.variant} />
          {hasDiscount && (
            <Badge text={`-${product.discount}%`} variant="warning" />
          )}
        </div>
        <AddToCartButton product={product} imageRef={imageRef} size="sm" />
      </div>
    </div>
  );
}
