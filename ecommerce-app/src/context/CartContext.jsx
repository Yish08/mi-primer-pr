import { createContext, useContext, useEffect, useState } from "react";
import { getCart, addToCartAPI } from "../services/cartService";
import { getCurrentUser } from "../utils/auth";

const CartContext = createContext();

export function CartProvider({ children }) {
  // Inicializamos el estado con los datos del localStorage directamente
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Calcular el total basado en los items del carrito
  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  // Mantener el total actualizado
  const [total, setTotal] = useState(() => {
    const savedCart = localStorage.getItem("cart");
    const items = savedCart ? JSON.parse(savedCart) : [];
    return calculateTotal(items);
  });

  useEffect(() => {
    const user = getCurrentUser();
    if(!user) return;

    getCart(user.userId)
      .then((serverCart) =>{
        if(serverCart.length > 0){
          setCartItems((localCart) => {
            return mergeCarts(localCart, serverCart)
          })
        } 
      })
      .catch(() => {
        //Falta
      });
  }, []);

  // Actualizar localStorage cuando cambie el carrito
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
    setTotal(calculateTotal(cartItems));
  }, [cartItems]);

  function mergeCarts(localCart, serverCart){
    const merged = [...serverCart];

    localCart.forEach((localItem) => {
      const i = merged.findIndex((item) => item._id === localItem._id);
      if (i >= 0 ) {
        merged[i].quantity = Math.max(merged[i].quantity, localItem.quantity);
      } else {
        merged.push(localItem);
      }
    });

    return merged;
  }

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
        item._id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const addToCart = (product, quantity = 1) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item._id === product._id);

      if (existingItem) {
        return prevItems.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevItems, { ...product, quantity }];
      }
    });

    // Llamada a la api
    const user = getCurrentUser();
    if(!user) return;
    
    addToCartAPI(user.userId, product._id, quantity).catch(() => {

    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

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
    getTotalItems,
    getTotalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context)
    throw new Error("useCart debe ser usado dentro de CartProvider");
  return context;
}
