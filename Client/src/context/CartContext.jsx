import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getCart, addToCart as apiAddToCart, updateCartItem as apiUpdateCartItem, removeFromCart as apiRemoveFromCart, clearCart as apiClearCart } from "../api/cart.api";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [itemCount, setItemCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch cart from server whenever user changes
  const fetchCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      setItemCount(0);
      setCartTotal(0);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getCart();
      const { items, itemCount: count, total } = res.data.data;
      setCartItems(items || []);
      setItemCount(count || 0);
      setCartTotal(total || 0);
    } catch {
      // A failed fetch is not the same as "cart is empty" — surface it so the
      // Cart page can show a retry option instead of a misleading empty state
      setError("Couldn't load your cart. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = useCallback(async (productId, quantity = 1) => {
    setError(null);
    try {
      const res = await apiAddToCart(productId, quantity);
      const { items, itemCount: count } = res.data.data;
      setCartItems(items || []);
      setItemCount(count || 0);
      // Recalculate total
      const newTotal = (items || []).reduce(
        (sum, item) => sum + item.priceAtAdd * item.quantity, 0
      );
      setCartTotal(newTotal);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to add to cart";
      setError(msg);
      return { success: false, error: msg };
    }
  }, []);

  const updateQuantity = useCallback(async (productId, quantity) => {
    setError(null);
    try {
      if (quantity === 0) {
        await apiRemoveFromCart(productId);
      } else {
        await apiUpdateCartItem(productId, quantity);
      }
      await fetchCart();
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update cart";
      setError(msg);
      return { success: false, error: msg };
    }
  }, [fetchCart]);

  const removeItem = useCallback(async (productId) => {
    setError(null);
    try {
      await apiRemoveFromCart(productId);
      await fetchCart();
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to remove item";
      setError(msg);
      return { success: false, error: msg };
    }
  }, [fetchCart]);

  const clearCartLocal = useCallback(async () => {
    try {
      await apiClearCart();
    } catch { /* ignore */ }
    setCartItems([]);
    setItemCount(0);
    setCartTotal(0);
  }, []);

  const clearLocalCartOnly = useCallback(() => {
    setCartItems([]);
    setItemCount(0);
    setCartTotal(0);
  }, []);

  return (
    <CartContext.Provider value={{
      cartItems,
      itemCount,
      cartTotal,
      loading,
      error,
      fetchCart,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart: clearCartLocal,
      clearLocalCartOnly,
    }}>
      {children}
    </CartContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => useContext(CartContext);
