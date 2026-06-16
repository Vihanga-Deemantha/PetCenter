import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getGalleryBuild, cloneBuild } from "../api/ecosystem.api";
import { useAuth } from "../context/AuthContext";
import { useBuilder } from "../context/BuilderContext";
import { PET_ICONS } from "./EcosystemPicker";

const formatPrice = (cents) =>
  cents === 0 ? "$0.00" : `$${(cents / 100).toFixed(2)}`;

export default function GalleryBuildDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loadBuild } = useBuilder();

  const [build, setBuild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cloning, setCloning] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    getGalleryBuild(id)
      .then((res) => {
        const b = res.data.data;
        setBuild(b);
        document.title = `${b.name} | PetCenter Gallery`;
      })
      .catch(() => setError("Build not found or is no longer published."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleClone = async () => {
    if (!user) {
      navigate(`/login?redirect=/ecosystem/gallery/${id}`);
      return;
    }
    setCloning(true);
    try {
      const res = await cloneBuild(id);
      const cloned = res.data.data;
      showToast("✅ Build cloned! Loading it in the builder...");
      // Update local clone count optimistically
      setBuild((prev) => ({ ...prev, cloneCount: (prev.cloneCount || 0) + 1 }));
      // Load cloned build in builder and navigate
      setTimeout(() => {
        loadBuild(cloned);
        navigate(`/ecosystem/build/${cloned.petType}?step=3`);
      }, 1200);
    } catch {
      showToast("Failed to clone this build. Please try again.", "error");
    } finally {
      setCloning(false);
    }
  };

  if (loading) return <DetailSkeleton />;
  if (error) return (
    <div style={{ textAlign: "center", padding: 64 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
      <h2 style={{ color: "#1a1a1a", marginBottom: 8 }}>Build not found</h2>
      <p style={{ color: "#888", marginBottom: 24 }}>{error}</p>
      <button
        onClick={() => navigate("/ecosystem/gallery")}
        style={{
          padding: "11px 24px",
          background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
          color: "#fff",
          border: "none",
          borderRadius: 12,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        ← Back to Gallery
      </button>
    </div>
  );

  const icon = PET_ICONS[build.petType] || "🐾";

  // Group selections by categoryKey
  const grouped = {};
  for (const sel of build.selections || []) {
    if (!grouped[sel.categoryKey]) grouped[sel.categoryKey] = [];
    grouped[sel.categoryKey].push(sel);
  }

  return (
    <div style={{ maxWidth: 780, margin: "0 auto" }}>
      {/* Back */}
      <button
        onClick={() => navigate("/ecosystem/gallery")}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#7c3aed", fontSize: 14, fontWeight: 600, padding: 0, marginBottom: 20,
          display: "flex", alignItems: "center", gap: 6,
        }}
      >
        ← Back to Gallery
      </button>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
        borderRadius: 20,
        padding: "28px 32px",
        marginBottom: 24,
        display: "flex",
        gap: 20,
        alignItems: "flex-start",
        flexWrap: "wrap",
      }}>
        <div style={{ fontSize: 52 }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 12, color: "#7c3aed", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
            {build.petType} ecosystem
          </div>
          <h1 style={{ fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 800, color: "#1a1a1a", margin: "0 0 6px" }}>
            {build.name}
          </h1>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
            by <strong style={{ color: "#4c1d95" }}>{build.userId?.name || "Anonymous"}</strong>
            {" · "}{build.selections?.length || 0} items
            {build.cloneCount > 0 && ` · 🔀 ${build.cloneCount} ${build.cloneCount === 1 ? "person" : "people"} built this`}
          </div>

          {/* Total */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>Total cost</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#4c1d95" }}>
                {formatPrice(build.totalPrice)}
              </div>
            </div>
            {/* Clone CTA */}
            <button
              onClick={handleClone}
              disabled={cloning}
              style={{
                padding: "12px 24px",
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 14,
                cursor: cloning ? "not-allowed" : "pointer",
                opacity: cloning ? 0.75 : 1,
                boxShadow: "0 4px 16px rgba(124,58,237,0.35)",
              }}
            >
              {cloning ? "Cloning..." : !user ? "Login to Clone" : "🔀 Clone this build"}
            </button>
          </div>
        </div>
      </div>

      {/* Selections grouped by category */}
      {Object.entries(grouped).map(([categoryKey, selections]) => (
        <CategoryGroup key={categoryKey} categoryKey={categoryKey} selections={selections} />
      ))}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}

// ─── Category Group ───────────────────────────────────────────────────────────
function CategoryGroup({ categoryKey, selections }) {
  const label = categoryKey.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{
        fontSize: 13,
        fontWeight: 700,
        color: "#888",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: 10,
      }}>
        {label}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {selections.map((sel, i) => (
          <SelectionRow key={i} sel={sel} />
        ))}
      </div>
    </div>
  );
}

// ─── Selection Row ────────────────────────────────────────────────────────────
function SelectionRow({ sel }) {
  const { productSnapshot } = sel;
  return (
    <div style={{
      display: "flex",
      gap: 14,
      alignItems: "center",
      background: "#fff",
      border: "1.5px solid #e5e7eb",
      borderRadius: 12,
      padding: "12px 16px",
    }}>
      {/* Image */}
      <div style={{
        width: 52,
        height: 52,
        borderRadius: 8,
        overflow: "hidden",
        background: "#f3f4f6",
        flexShrink: 0,
      }}>
        {productSnapshot?.image ? (
          <img
            src={productSnapshot.image}
            alt={productSnapshot.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 22 }}>📦</div>
        )}
      </div>

      {/* Name + price */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", marginBottom: 2 }}>
          {productSnapshot?.name || "Unknown product"}
        </div>
        <div style={{ fontSize: 13, color: "#7c3aed", fontWeight: 700 }}>
          {formatPrice(productSnapshot?.price || 0)}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div style={{ maxWidth: 780, margin: "0 auto" }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{
          height: i === 1 ? 140 : 70,
          background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.4s infinite",
          borderRadius: 16,
          marginBottom: 16,
        }} />
      ))}
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  const bg = type === "error" ? "#fef2f2" : "#f0fdf4";
  const border = type === "error" ? "#fca5a5" : "#86efac";
  const color = type === "error" ? "#b91c1c" : "#166534";
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
