import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getFavorites, addFavorite, removeFavorite } from "../api/favorite.api";
import { useAuth } from "./AuthContext";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user, loading: authLoading } = useAuth();

  // Set of "itemType:itemId" strings for O(1) lookup
  const [favSet, setFavSet] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Guards against a slow response for a PREVIOUS user landing after a fast
  // logout-then-login-as-someone-else, which would otherwise populate favSet
  // with the wrong account's favorites for a moment.
  const requestedForRef = useRef(null);

  // Load all favorites when user logs in
  const loadFavorites = useCallback(() => {
    if (authLoading) return;
    const requestedFor = user?._id || null;
    requestedForRef.current = requestedFor;

    if (!user) {
      setFavSet(new Set());
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    getFavorites({ limit: 100, page: 1 })
      .then(async (res) => {
        if (requestedForRef.current !== requestedFor) return;
        const firstPage = res.data.data || [];
        const totalPages = res.data.pagination?.totalPages || 1;
        const remainingPages = await Promise.all(
          Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) =>
            getFavorites({ limit: 100, page: index + 2 })
          )
        );
        if (requestedForRef.current !== requestedFor) return;
        const items = firstPage.concat(
          remainingPages.flatMap((pageResponse) => pageResponse.data.data || [])
        );
        const set = new Set(items.map((f) => `${f.itemType}:${f.itemId}`));
        setFavSet(set);
      })
      .catch(() => {
        if (requestedForRef.current !== requestedFor) return;
        // A failed load must not look like "nothing is favorited" — every
        // heart icon site-wide reads from favSet, so leaving it empty here
        // would make every previously-saved item appear unsaved.
        setError("Couldn't load your favorites.");
      })
      .finally(() => {
        if (requestedForRef.current === requestedFor) setLoading(false);
      });
  }, [authLoading, user]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const isFavorited = useCallback(
    (itemType, itemId) => favSet.has(`${itemType}:${itemId}`),
    [favSet]
  );

  // Per-item promise chain — a rapid double-click on the same heart must not
  // fire an add and a remove as overlapping requests (whichever response
  // lands last would silently win and could disagree with the optimistic
  // UI). Chaining onto the previous in-flight request for that key forces
  // the add/remove calls for one item to resolve on the server in the same
  // order the user issued them.
  const pendingRef = useRef(new Map());

  const toggleFavorite = useCallback(
    (itemType, itemId) => {
      const key = `${itemType}:${itemId}`;
      const alreadyFavorited = favSet.has(key);

      // Optimistic update
      setFavSet((prev) => {
        const next = new Set(prev);
        if (alreadyFavorited) next.delete(key);
        else next.add(key);
        return next;
      });

      const prevRequest = pendingRef.current.get(key) || Promise.resolve();
      const request = prevRequest
        .then(() => (alreadyFavorited ? removeFavorite(itemType, itemId) : addFavorite(itemType, itemId)))
        .catch(() => {
          // Revert only this call's optimistic change on failure
          setFavSet((prev) => {
            const next = new Set(prev);
            if (alreadyFavorited) next.add(key);
            else next.delete(key);
            return next;
          });
        });

      pendingRef.current.set(key, request);
    },
    [favSet]
  );

  return (
    <FavoritesContext.Provider value={{ isFavorited, toggleFavorite, loading, error, reload: loadFavorites, count: favSet.size }}>
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
