import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getFavorites, addFavorite, removeFavorite } from "../api/favorite.api";
import { useAuth } from "./AuthContext";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();

  // Set of "itemType:itemId" strings for O(1) lookup
  const [favSet, setFavSet] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all favorites when user logs in
  const loadFavorites = useCallback(() => {
    if (!user) {
      setFavSet(new Set());
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    getFavorites({ limit: 500 })
      .then((res) => {
        const items = res.data.data || [];
        const set = new Set(items.map((f) => `${f.itemType}:${f.itemId}`));
        setFavSet(set);
      })
      .catch(() => {
        // A failed load must not look like "nothing is favorited" — every
        // heart icon site-wide reads from favSet, so leaving it empty here
        // would make every previously-saved item appear unsaved.
        setError("Couldn't load your favorites.");
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

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
    <FavoritesContext.Provider value={{ isFavorited, toggleFavorite, loading, error, reload: loadFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used inside FavoritesProvider");
  return ctx;
};
