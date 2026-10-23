import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getCart, replaceCart } from "../services/cartService";
import { getProductById } from "../services/productsService";
import { getCurrentUser } from "../utils/auth";

const CartContext = createContext();

// Tope de unidades que se pueden tener de un producto: su stock.
// Si un producto viejo no trae stock, no se limita (syncStock lo corrige).
const maxQuantity = (product) =>
  Number.isFinite(product?.stock) ? Math.max(0, product.stock) : Infinity;

export function CartProvider({ children }) {
  // Inicializamos el estado con los datos del localStorage directamente
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [cartId, setCartId] = useState(null);
  const [initialized, setInitialized] = useState(false);
  // Avisos de productos que se ajustaron porque cambio su stock
  const [stockNotices, setStockNotices] = useState([]);

  // Copia del carrito para leerlo dentro de funciones async sin closures viejos
  const cartItemsRef = useRef(cartItems);
  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  function mergeCarts(localCart, serverCart){
    const merged = [...serverCart];

    localCart.forEach((localItem) => {
      const i = merged.findIndex((item) => item._id === localItem._id);
      if (i >= 0 ) {
        // El producto del servidor trae el stock actual: nunca pasar de ahi
        merged[i] = {
          ...merged[i],
          quantity: Math.min(
            Math.max(merged[i].quantity, localItem.quantity),
            maxQuantity(merged[i])
          ),
        };
      } else {
        merged.push(localItem);
      }
    });

    return merged;
  }

  useEffect(() => {
    const user = getCurrentUser();
    if(!user) return;

    getCart(user.userId)
      .then((serverCart) =>{
        setCartId(serverCart.cartId)
        if(serverCart.items.length > 0){
          setCartItems((localCart) => {
            return mergeCarts(localCart, serverCart.items)
          })
        }
      })
      .catch(() => {
        //Falta
      })
      .finally(() => setInitialized(true));
  }, []);

  // Actualizar localStorage y servidor cuando cambie el carrito, el cartId o la inicializacion
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));

    const user = getCurrentUser();
    if(user && initialized && cartId){
      replaceCart(cartId, user.userId, cartItems).catch(() => {});
    }
  }, [cartItems, initialized, cartId]);

  const removeFromCart = (productId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item._id !== productId)
    );
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item._id === productId
          ? { ...item, quantity: Math.min(newQuantity, maxQuantity(item)) }
          : item
      )
    );
  };

  // Nunca deja pasar del stock. Devuelve cuantas unidades se agregaron de verdad
  // (0 si ya estaban todas las disponibles en el carrito).
  const addToCart = (product, quantity = 1) => {
    const max = maxQuantity(product);
    const current =
      cartItemsRef.current.find((item) => item._id === product._id)?.quantity ?? 0;
    const added = Math.max(0, Math.min(quantity, max - current));
    if (added === 0) return 0;

    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item._id === product._id);

      if (existingItem) {
        // Se refrescan los datos del producto (stock, precio) con los mas nuevos
        return prevItems.map((item) =>
          item._id === product._id
            ? {
                ...item,
                ...product,
                quantity: Math.min(item.quantity + quantity, max),
              }
            : item
        );
      } else {
        return [...prevItems, { ...product, quantity: Math.min(quantity, max) }];
      }
    });
    return added;
  };

  // Consulta el stock real de cada producto del carrito y ajusta las cantidades:
  // otra persona pudo comprar mientras tanto. Asi el checkout no falla por stock.
  const syncStock = useCallback(async () => {
    const items = cartItemsRef.current;
    if (items.length === 0) return [];

    const results = await Promise.allSettled(
      items.map((item) => getProductById(item._id))
    );

    // productId -> producto actual (null si ya no existe). Si fallo la red,
    // el producto no entra al mapa y se queda como estaba.
    const fresh = new Map();
    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        fresh.set(items[i]._id, result.value);
      } else if (result.reason?.response?.status === 404) {
        fresh.set(items[i]._id, null);
      }
    });

    const notices = [];
    items.forEach((item) => {
      if (!fresh.has(item._id)) return;
      const product = fresh.get(item._id);
      if (!product) {
        notices.push(`"${item.name}" ya no está disponible y lo quitamos de tu carrito.`);
      } else if (maxQuantity(product) === 0) {
        notices.push(`"${product.name}" se agotó y lo quitamos de tu carrito.`);
      } else if (item.quantity > maxQuantity(product)) {
        const quedan = product.stock === 1 ? "queda" : "quedan";
        notices.push(
          `Solo ${quedan} ${product.stock} de "${product.name}", ajustamos la cantidad.`
        );
      }
    });

    setCartItems((prevItems) => {
      let changed = false;
      const nextItems = prevItems.flatMap((item) => {
        if (!fresh.has(item._id)) return [item];
        const product = fresh.get(item._id);
        const max = product ? maxQuantity(product) : 0;
        if (max === 0) {
          changed = true;
          return [];
        }
        const quantity = Math.min(item.quantity, max);
        if (
          quantity !== item.quantity ||
          product.stock !== item.stock ||
          product.price !== item.price
        ) {
          changed = true;
        }
        return [{ ...item, ...product, quantity }];
      });
      // Sin cambios se regresa el mismo arreglo: no se re-renderiza ni se
      // vuelve a guardar el carrito en el servidor
      return changed ? nextItems : prevItems;
    });
    setStockNotices(notices);
    return notices;
  }, []);

  const dismissStockNotices = () => setStockNotices([]);

  const clearCart = () => {
    setCartItems([]);
  };

  const getQuantityInCart = (productId) =>
    cartItems.find((item) => item._id === productId)?.quantity ?? 0;

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const value = {
    cartItems,
    total: getTotalPrice(),
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getQuantityInCart,
    getTotalItems,
    getTotalPrice,
    syncStock,
    stockNotices,
    dismissStockNotices,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context)
    throw new Error("useCart debe ser usado dentro de CartProvider");
  return context;
}
