import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useFavorites } from "../../context/FavoritesContext";
import { useAuth } from "../../context/AuthContext";

/**
 * HeartButton — adds to/removes from favorites with optimistic UI.
 * Placed on top of cards; uses stopPropagation to avoid card click.
 */
export default function HeartButton({
  itemType,   // "listing" | "product"
  itemId,
  size = 20,
  style = {},
  className = "",
}) {
  const { user } = useAuth();
  const { isFavorited, toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();

  const favorited = isFavorited(itemType, itemId);

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }

    toggleFavorite(itemType, itemId);
  };

  return (
    <button
      onClick={handleClick}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      title={favorited ? "Remove from favorites" : "Save to favorites"}
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size + 12,
        height: size + 12,
        borderRadius: "50%",
        border: "none",
        background: favorited ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.85)",
        backdropFilter: "blur(4px)",
        cursor: "pointer",
        transition: "all 0.18s ease",
        padding: 0,
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        ...style,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={favorited ? "#ef4444" : "none"}
        stroke={favorited ? "#ef4444" : "#64748b"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          transition: "transform 0.18s ease",
          transform: favorited ? "scale(1.15)" : "scale(1)",
        }}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
