import axiosInstance from "./axiosInstance";

export const getFavorites = (params = {}) =>
  axiosInstance.get("/favorites", { params });

export const checkFavorites = (items) =>
  axiosInstance.post("/favorites/check", { items });

export const addFavorite = (itemType, itemId) =>
  axiosInstance.post("/favorites", { itemType, itemId });

export const removeFavorite = (itemType, itemId) =>
  axiosInstance.delete(`/favorites/${itemType}/${itemId}`);
