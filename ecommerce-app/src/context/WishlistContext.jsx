import { createContext, useContext, useEffect, useState } from "react";
import {
  getWishlist,
  addToWishlist as addToWishlistAPI,
  removeFromWishlist as removeFromWishlistAPI,
} from "../services/wishlistService";
import { getCurrentUser } from "../utils/auth";

const WishlistContext = createContext();

const withProduct = (items, product) =>
  items.some((item) => item._id === product._id) ? items : [...items, product];

const withoutProduct = (items, productId) =>
  items.filter((item) => item._id !== productId);

export function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useState([]);
  // Solo hay algo que cargar si hay sesion; login y logout recargan la pagina
  const [loading, setLoading] = useState(() => getCurrentUser() !== null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!getCurrentUser()) return;

    getWishlist()
      .then(setWishlistItems)
      .catch(() => setError("No se pudieron cargar tus favoritos"))
      .finally(() => setLoading(false));
  }, []);

  const isInWishlist = (productId) =>
    wishlistItems.some((item) => item._id === productId);

  // Actualizaciones optimistas con setState funcional: puede haber varias
  // operaciones en vuelo a la vez (p. ej. mover varios productos al carrito
  // seguidos) y ninguna debe pisar a otra. Si la API falla, se revierte solo
  // ese producto.
  const addToWishlist = async (product) => {
    setWishlistItems((items) => withProduct(items, product));
    try {
      await addToWishlistAPI(product._id);
    } catch {
      setWishlistItems((items) => withoutProduct(items, product._id));
    }
  };

  const removeFromWishlist = async (productId) => {
    const removed = wishlistItems.find((item) => item._id === productId);
    setWishlistItems((items) => withoutProduct(items, productId));
    try {
      await removeFromWishlistAPI(productId);
    } catch {
      if (removed) setWishlistItems((items) => withProduct(items, removed));
    }
  };

  const toggleWishlist = (product) =>
    isInWishlist(product._id)
      ? removeFromWishlist(product._id)
      : addToWishlist(product);

  const value = {
    wishlistItems,
    loading,
    error,
    isInWishlist,
    toggleWishlist,
    removeFromWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context)
    throw new Error("useWishlist debe ser usado dentro de WishlistProvider");
  return context;
}
