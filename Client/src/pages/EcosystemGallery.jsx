import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getGallery } from "../api/ecosystem.api";
import { PET_ICONS } from "./EcosystemPicker";

const formatPrice = (cents) =>
  cents === 0 ? "$0.00" : `$${(cents / 100).toFixed(2)}`;

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

const ALL_PET_TYPES = ["fish", "snake", "bird", "spider", "turtle", "mouse", "reptile", "amphibian"];
const PET_LABELS = {
  fish: "Fish", snake: "Snake", bird: "Bird", spider: "Spider",
  turtle: "Turtle", mouse: "Mouse", reptile: "Reptile", amphibian: "Amphibian",
};

export default function EcosystemGallery() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activePetType = searchParams.get("petType") || "";
  const activeSort = searchParams.get("sort") || "newest";

  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const LIMIT = 12;

  const fetchGallery = useCallback(async (reset = false) => {
    if (reset) setBuilds([]);
    setLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const params = {
        page: currentPage,
        limit: LIMIT,
        sort: activeSort,
      };
      if (activePetType) params.petType = activePetType;
      const res = await getGallery(params);
      const { data, pagination } = res.data;
      setBuilds((prev) => reset ? (data || []) : [...prev, ...(data || [])]);
      setHasMore(pagination?.currentPage < pagination?.totalPages);
      if (reset) setPage(2);
      else setPage((p) => p + 1);
    } catch {
      setError("Failed to load gallery. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [activePetType, activeSort, page]);

  useEffect(() => {
    document.title = "Inspiration Gallery | PetCenter Ecosystem";
    fetchGallery(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePetType, activeSort]);

  const setFilter = (petType) => {
    const next = new URLSearchParams(searchParams);
    if (petType) next.set("petType", petType);
    else next.delete("petType");
    next.delete("sort");
    setSearchParams(next, { replace: true });
  };

  const setSort = (sort) => {
    const next = new URLSearchParams(searchParams);
    next.set("sort", sort);
    setSearchParams(next, { replace: true });
  };

  return (
    <div style={{ maxWidth: 1060, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "#1a1a1a", marginBottom: 8 }}>
          Inspiration Gallery
        </h1>
        <p style={{ fontSize: 15, color: "#666" }}>
          Real setups built by the PetCenter community. Clone any build to start your own.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20, alignItems: "center" }}>
        {/* Pet type tabs */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
          <FilterTab label="All" isActive={!activePetType} onClick={() => setFilter("")} />
          {ALL_PET_TYPES.map((pet) => (
            <FilterTab
              key={pet}
              label={`${PET_ICONS[pet] || "🐾"} ${PET_LABELS[pet]}`}
              isActive={activePetType === pet}
              onClick={() => setFilter(pet)}
            />
          ))}
        </div>
        {/* Sort */}
        <select
          value={activeSort}
          onChange={(e) => setSort(e.target.value)}
          style={{
            padding: "7px 12px",
            border: "1.5px solid #e5e7eb",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            color: "#374151",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          <option value="newest">Newest first</option>
          <option value="mostCloned">Most cloned</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div style={{ textAlign: "center", padding: 32, color: "#c62828", background: "#fff0f0", borderRadius: 12 }}>
          {error}
        </div>
      )}

      {/* Grid */}
      {!error && (
        <>
          {loading && builds.length === 0 ? (
            <GallerySkeleton />
          ) : builds.length === 0 ? (
            <EmptyGallery />
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 18,
            }}>
              {builds.map((build) => (
                <GalleryCard
                  key={build._id}
                  build={build}
                  onClick={() => navigate(`/ecosystem/gallery/${build._id}`)}
                />
              ))}
              {/* Skeleton cards while loading more */}
              {loading && builds.length > 0 && (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={`sk-${i}`} style={{
                    height: 240,
                    background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.4s infinite",
                    borderRadius: 16,
                  }} />
                ))
              )}
            </div>
          )}

          {/* Load more */}
          {hasMore && !loading && (
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <button
                onClick={() => fetchGallery(false)}
                style={{
                  padding: "12px 32px",
                  background: "#f5f3ff",
                  color: "#7c3aed",
                  border: "1.5px solid #ddd6fe",
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Load more builds
              </button>
            </div>
          )}
        </>
      )}

      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}

// ─── Filter Tab ───────────────────────────────────────────────────────────────
function FilterTab({ label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 14px",
        background: isActive ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "#f3f4f6",
        color: isActive ? "#fff" : "#374151",
        border: "none",
        borderRadius: 20,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}

// ─── Gallery Card ─────────────────────────────────────────────────────────────
function GalleryCard({ build, onClick }) {
  const [hovered, setHovered] = useState(false);
  const icon = PET_ICONS[build.petType] || "🐾";

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        border: "1.5px solid #e5e7eb",
        borderRadius: 16,
        padding: "20px",
        cursor: "pointer",
        transition: "all 0.18s ease",
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered ? "0 10px 32px rgba(0,0,0,0.1)" : "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      {/* Icon + Pet type */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#888", fontWeight: 600, textTransform: "capitalize" }}>
            {build.petType} setup
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.2 }}>
            {build.name}
          </div>
        </div>
      </div>

      {/* Meta */}
      <div style={{ fontSize: 12, color: "#888", marginBottom: 12, lineHeight: 1.7 }}>
        by <span style={{ fontWeight: 600, color: "#4c1d95" }}>{build.userId?.name || "Anonymous"}</span>
        {" · "}{build.selections?.length || 0} items
        {" · "}<strong style={{ color: "#1a1a1a" }}>{formatPrice(build.totalPrice)}</strong>
      </div>

      {/* Clone count + date */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {build.cloneCount > 0 ? (
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#7c3aed",
            background: "#ede9fe",
            padding: "3px 10px",
            borderRadius: 20,
          }}>
            🔀 {build.cloneCount} {build.cloneCount === 1 ? "person" : "people"} built this
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "#d1d5db" }}>Be the first to clone!</span>
        )}
        <span style={{ fontSize: 11, color: "#9ca3af" }}>{formatDate(build.publishedAt || build.createdAt)}</span>
      </div>

      {/* View Build CTA */}
      <div style={{
        marginTop: 14,
        padding: "9px 0",
        background: hovered ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "#f5f3ff",
        color: hovered ? "#fff" : "#7c3aed",
        borderRadius: 10,
        textAlign: "center",
        fontSize: 13,
        fontWeight: 700,
        transition: "all 0.18s",
      }}>
        View Build →
      </div>
    </div>
  );
}

// ─── Empty Gallery ────────────────────────────────────────────────────────────
function EmptyGallery() {
  return (
    <div style={{
      textAlign: "center",
      padding: "64px 24px",
      background: "#fafafa",
      borderRadius: 20,
      border: "2px dashed #e5e7eb",
    }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>🖼️</div>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>
        No builds in the gallery yet
      </h3>
      <p style={{ fontSize: 14, color: "#888" }}>
        Be the first to share yours! Build a setup and publish it from My Builds.
      </p>
    </div>
  );
}

// ─── Gallery Skeleton ─────────────────────────────────────────────────────────
function GallerySkeleton() {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
      gap: 18,
    }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{
          height: 240,
          background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.4s infinite",
          borderRadius: 16,
        }} />
      ))}
    </div>
  );
}
