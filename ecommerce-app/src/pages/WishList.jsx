import { useState } from "react";
import { Link } from "react-router-dom";
import WishlistItem from "../components/WishList/WishlistItem";
import Button from "../components/common/Button";
import ErrorMessage from "../components/common/ErrorMessage/ErrorMessage";
import Icon from "../components/common/Icon/Icon";
import Loading from "../components/common/Loading/Loading";
import { useWishlist } from "../context/WishlistContext";
import "./WishList.css";

export default function WishList() {
  const { wishlistItems, loading, error } = useWishlist();
  // Aviso para lectores de pantalla cuando un producto pasa al carrito
  const [announcement, setAnnouncement] = useState("");

  if (loading) {
    return (
      <div className="wishlist-page">
        <Loading message="Cargando favoritos..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="wishlist-page">
        <ErrorMessage message={error} />
      </div>
    );
  }

  const content = wishlistItems.length ? (
    <div className="wishlist-page">
      <div className="wishlist-header">
        <h1>Mis favoritos</h1>
        <p className="muted">
          {wishlistItems.length === 1
            ? "1 producto guardado"
            : `${wishlistItems.length} productos guardados`}
        </p>
      </div>

      <ul className="wishlist-list">
        {wishlistItems.map((product) => (
          <WishlistItem
            key={product._id}
            product={product}
            onMovedToCart={(moved) =>
              setAnnouncement(`${moved.name} se movió a tu carrito`)
            }
          />
        ))}
      </ul>
    </div>
  ) : (
    <div className="wishlist-page wishlist-empty">
      <Icon name="heart" size={48} />
      <h1>Tu lista de deseos está vacía</h1>
      <p className="muted">
        Toca el corazón de cualquier producto para guardarlo aquí y comprarlo
        más tarde.
      </p>
      <Link to="/">
        <Button>Descubrir productos</Button>
      </Link>
    </div>
  );

  // La region "status" vive fuera del contenido para seguir montada cuando
  // la lista pasa a vacia, y asi el ultimo aviso no se pierde.
  return (
    <>
      {content}
      <p className="visually-hidden" role="status">
        {announcement}
      </p>
    </>
  );
}
