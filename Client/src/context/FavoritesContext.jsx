import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getFavorites, addFavorite, removeFavorite } from "../api/favorite.api";
import { useAuth } from "./AuthContext";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();

  // Set of "itemType:itemId" strings for O(1) lookup
  const [favSet, setFavSet] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Load all favorites when user logs in
  useEffect(() => {
    if (!user) {
      setFavSet(new Set());
      return;
    }
    setLoading(true);
    getFavorites({ limit: 500 })
      .then((res) => {
        const items = res.data.data || [];
        const set = new Set(items.map((f) => `${f.itemType}:${f.itemId}`));
        setFavSet(set);
      })
      .catch(() => {}) // silently fail — not critical
      .finally(() => setLoading(false));
  }, [user]);

  const isFavorited = useCallback(
    (itemType, itemId) => favSet.has(`${itemType}:${itemId}`),
    [favSet]
  );

  const toggleFavorite = useCallback(
    async (itemType, itemId) => {
      const key = `${itemType}:${itemId}`;
      const alreadyFavorited = favSet.has(key);

      // Optimistic update
      setFavSet((prev) => {
        const next = new Set(prev);
        if (alreadyFavorited) next.delete(key);
        else next.add(key);
        return next;
      });

      try {
        if (alreadyFavorited) {
          await removeFavorite(itemType, itemId);
        } else {
          await addFavorite(itemType, itemId);
        }
      } catch {
        // Revert on failure
        setFavSet((prev) => {
          const next = new Set(prev);
          if (alreadyFavorited) next.add(key);
          else next.delete(key);
          return next;
        });
      }
    },
    [favSet]
  );

  return (
    <FavoritesContext.Provider value={{ isFavorited, toggleFavorite, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used inside FavoritesProvider");
  return ctx;
};
