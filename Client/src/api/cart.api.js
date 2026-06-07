import axiosInstance from "./axiosInstance";

export const getCart = () =>
  axiosInstance.get("/cart");

export const addToCart = (productId, quantity) =>
  axiosInstance.post("/cart/items", { productId, quantity });

export const updateCartItem = (productId, quantity) =>
  axiosInstance.put(`/cart/items/${productId}`, { quantity });

export const removeFromCart = (productId) =>
  axiosInstance.delete(`/cart/items/${productId}`);

export const clearCart = () =>
  axiosInstance.delete("/cart");
