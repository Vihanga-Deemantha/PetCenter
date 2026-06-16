import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyBuilds,
  deleteBuild,
  togglePublish,
  bulkAddToCart,
} from "../api/ecosystem.api";
import { useBuilder } from "../context/BuilderContext";
import { useCart } from "../context/CartContext";
import { PET_ICONS } from "./EcosystemPicker";

const formatPrice = (cents) =>
  cents === 0 ? "$0.00" : `$${(cents / 100).toFixed(2)}`;

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

export default function MyBuilds() {
  const navigate = useNavigate();
  const { loadBuild } = useBuilder();
  const { fetchCart } = useCart();

  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchBuilds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyBuilds();
      setBuilds(res.data.data || []);
    } catch {
      setError("Failed to load your builds. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "My Builds | PetCenter Ecosystem";
    fetchBuilds();
  }, [fetchBuilds]);

  const handleLoad = (build) => {
    loadBuild(build);
    navigate(`/ecosystem/build/${build.petType}?step=3`);
  };

  const handleAddToCart = async (build) => {
    try {
      const items = build.selections.map((s) => ({ productId: s.productId, quantity: 1 }));
      const res = await bulkAddToCart(items);
      const { added, failed } = res.data.data;
      await fetchCart();
      if (failed.length === 0) {
        showToast(`✅ ${added.length} items from "${build.name}" added to cart!`);
      } else {
        showToast(`✅ ${added.length} added, ⚠️ ${failed.length} unavailable.`, "warning");
      }
    } catch {
      showToast("Failed to add to cart.", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteBuild(id);
      setBuilds((prev) => prev.filter((b) => b._id !== id));
      setConfirmDelete(null);
      showToast("Build deleted.");
    } catch {
      showToast("Failed to delete build.", "error");
    }
  };

  const handleTogglePublish = async (build) => {
    try {
      const res = await togglePublish(build._id);
      const updated = res.data.data;
      setBuilds((prev) => prev.map((b) => (b._id === updated._id ? updated : b)));
      showToast(updated.isPublished ? "🌐 Build is now public in the gallery!" : "Build removed from gallery.");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update publish status.", "error");
    }
  };

  if (loading) return <BuildsSkeleton />;
  if (error) return (
    <div style={{ textAlign: "center", padding: 48, color: "#c62828" }}>{error}</div>
  );

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 800, color: "#1a1a1a", marginBottom: 8 }}>
          My Builds
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <p style={{ fontSize: 15, color: "#666" }}>
            {builds.length} saved ecosystem build{builds.length !== 1 ? "s" : ""}
          </p>
          <button
            onClick={() => navigate("/ecosystem")}
            style={{
              padding: "7px 16px",
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              color: "#fff",
              border: "none",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + New Build
          </button>
        </div>
      </div>

      {/* Empty State */}
      {builds.length === 0 ? (
        <EmptyState onStart={() => navigate("/ecosystem")} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {builds.map((build) => (
            <BuildCard
              key={build._id}
              build={build}
              onLoad={() => handleLoad(build)}
              onAddToCart={() => handleAddToCart(build)}
              onDelete={() => setConfirmDelete(build._id)}
              onTogglePublish={() => handleTogglePublish(build)}
            />
          ))}
        </div>
      )}

      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 20,
            padding: "28px 32px",
            maxWidth: 360,
            width: "90%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🗑️</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Delete this build?</h3>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 22 }}>
              This action cannot be undone. Your build will be permanently removed.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, padding: "10px 0", background: "#f3f4f6", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, color: "#374151" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                style={{ flex: 1, padding: "10px 0", background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700 }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}

// ─── Build Card ───────────────────────────────────────────────────────────────
function BuildCard({ build, onLoad, onAddToCart, onDelete, onTogglePublish }) {
  const icon = PET_ICONS[build.petType] || "🐾";
  const [publishLoading, setPublishLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

  const handlePublish = async () => {
    setPublishLoading(true);
    await onTogglePublish();
    setPublishLoading(false);
  };

  const handleCart = async () => {
    setCartLoading(true);
    await onAddToCart();
    setCartLoading(false);
  };

  return (
    <div style={{
      background: "#fff",
      border: "1.5px solid #e5e7eb",
      borderRadius: 16,
      padding: "18px 22px",
      display: "flex",
      gap: 16,
      alignItems: "flex-start",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      transition: "box-shadow 0.15s",
    }}>
      {/* Icon */}
      <div style={{
        width: 52,
        height: 52,
        borderRadius: 12,
        background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 26,
        flexShrink: 0,
      }}>
        {icon}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>{build.name}</span>
          {build.isPublished && (
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              background: "#dcfce7",
              color: "#166534",
              padding: "2px 8px",
              borderRadius: 20,
            }}>
              🌐 Published
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>
          {build.petType.charAt(0).toUpperCase() + build.petType.slice(1)} •{" "}
          {build.selections?.length || 0} items •{" "}
          <strong style={{ color: "#4c1d95" }}>{formatPrice(build.totalPrice)}</strong> •{" "}
          Saved {formatDate(build.createdAt)}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <ActionButton label="Load Build" onClick={onLoad} variant="primary" />
          <ActionButton label={cartLoading ? "Adding..." : "Add to Cart"} onClick={handleCart} variant="secondary" />
          <ActionButton
            label={publishLoading ? "..." : build.isPublished ? "Remove from Gallery" : "Share to Gallery"}
            onClick={handlePublish}
            variant={build.isPublished ? "ghost" : "outline"}
          />
          <ActionButton label="Delete" onClick={onDelete} variant="danger" />
        </div>
      </div>
    </div>
  );
}

// ─── Action Button ────────────────────────────────────────────────────────────
function ActionButton({ label, onClick, variant }) {
  const styles = {
    primary: { bg: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "#fff", border: "none" },
    secondary: { bg: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe" },
    outline: { bg: "#fff", color: "#374151", border: "1px solid #d1d5db" },
    ghost: { bg: "#fff", color: "#9ca3af", border: "1px solid #e5e7eb" },
    danger: { bg: "#fff0f0", color: "#dc2626", border: "1px solid #fca5a5" },
  };
  const s = styles[variant] || styles.outline;
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 14px",
        background: s.bg,
        color: s.color,
        border: s.border,
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onStart }) {
  return (
    <div style={{
      textAlign: "center",
      padding: "64px 24px",
      background: "#fafafa",
      borderRadius: 20,
      border: "2px dashed #e5e7eb",
    }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>🏗️</div>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>
        No builds yet
      </h3>
      <p style={{ fontSize: 14, color: "#888", maxWidth: 340, margin: "0 auto 24px" }}>
        You haven't saved any ecosystem builds yet. Start building a setup for your pet and save it here.
      </p>
      <button
        onClick={onStart}
        style={{
          padding: "12px 28px",
          background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
          color: "#fff",
          border: "none",
          borderRadius: 12,
          fontWeight: 700,
          fontSize: 15,
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
        }}
      >
        Start Building 🐾
      </button>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function BuildsSkeleton() {
  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          height: 100,
          background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.4s infinite",
          borderRadius: 16,
          marginBottom: 14,
        }} />
      ))}
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  const bg = type === "error" ? "#fef2f2" : type === "warning" ? "#fff7ed" : "#f0fdf4";
  const border = type === "error" ? "#fca5a5" : type === "warning" ? "#fed7aa" : "#86efac";
  const color = type === "error" ? "#b91c1c" : type === "warning" ? "#92400e" : "#166534";
  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      left: "50%",
      transform: "translateX(-50%)",
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 12,
      padding: "12px 20px",
      fontSize: 14,
      color,
      fontWeight: 600,
      zIndex: 2000,
      maxWidth: "90vw",
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    }}>
      {msg}
    </div>
  );
}
