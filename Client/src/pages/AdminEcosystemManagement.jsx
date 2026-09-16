import React, { useState, useEffect, useCallback } from "react";
import { getAdminEcosystemBuilds, adminUnpublishBuild } from "../api/admin.api";

const formatPrice = (cents) =>
  cents === 0 ? "$0.00" : `$${(cents / 100).toFixed(2)}`;

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

const PET_ICONS = {
  fish: "🐟", snake: "🐍", bird: "🦜", spider: "🕷️",
  turtle: "🐢", mouse: "🐭", reptile: "🦎", amphibian: "🐸",
};

export default function AdminEcosystemManagement() {
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchBuilds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminEcosystemBuilds();
      setBuilds(res.data.data || []);
    } catch {
      setError("Failed to load ecosystem builds.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Ecosystem — Admin | PetCenter";
    fetchBuilds();
  }, [fetchBuilds]);

  const handleUnpublish = async (id) => {
    setActionId(id);
    try {
      await adminUnpublishBuild(id);
      setBuilds((prev) => prev.filter((b) => b._id !== id));
      showToast("Build removed from gallery.");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to unpublish build.", "error");
    } finally {
      setActionId(null);
    }
  };

  const filtered = builds.filter((b) => {
    const q = search.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.petType.toLowerCase().includes(q) ||
      b.userId?.name?.toLowerCase().includes(q) ||
      b.userId?.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="mb-7 border-b border-border pb-7">
        <p className="text-xs tracking-[0.18em] uppercase text-accent font-semibold mb-2.5">Admin</p>
        <h1 className="font-heading text-[32px] font-medium tracking-tight text-[#292925] mb-1.5">
          Ecosystem gallery moderation
        </h1>
        <p className="text-[#6e6e64]">
          {builds.length} published build{builds.length !== 1 ? "s" : ""} in the public gallery.
          Use this panel to remove builds that violate community guidelines.
        </p>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-sm">
        <input
          type="text"
          placeholder="Search by name, pet type, or user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.75 border border-border rounded-xl text-sm outline-none focus:border-accent transition-colors bg-white"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 rounded-xl mb-6 font-medium text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-border animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[22px] border border-dashed border-[#dcd4c6]">
          <div className="text-5xl mb-4">🖼️</div>
          <p className="text-[#6e6e64] font-medium">
            {search ? "No builds match your search." : "No published builds in the gallery yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((build) => (
            <BuildRow
              key={build._id}
              build={build}
              loading={actionId === build._id}
              onUnpublish={() => handleUnpublish(build._id)}
            />
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full font-medium text-sm shadow-xl max-w-[90vw] ${
          toast.type === "error"
            ? "bg-[#F7E9DF] text-[#8f4a28]"
            : "bg-[#292925] text-light"
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─── Build Row ────────────────────────────────────────────────────────────────
function BuildRow({ build, loading, onUnpublish }) {
  const icon = PET_ICONS[build.petType] || "🐾";
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="bg-white border border-border rounded-2xl px-5 py-4 flex items-center gap-4">
      {/* Icon */}
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl shrink-0">
        {icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-semibold text-[#292925] text-sm">{build.name}</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-lg bg-[#E9EDE4] text-[#40543C]">
            Published
          </span>
          {build.cloneCount > 0 && (
            <span className="text-[10px] font-medium text-primary">
              🔀 {build.cloneCount} clones
            </span>
          )}
        </div>
        <div className="text-xs text-[#8a8a80]">
          {build.petType} setup ·{" "}
          {build.selections?.length || 0} items ·{" "}
          <strong className="text-[#5c5c54]">{formatPrice(build.totalPrice)}</strong> ·{" "}
          by <span className="text-primary font-medium">{build.userId?.name || "Unknown"}</span>{" "}
          ({build.userId?.email || "—"}) ·{" "}
          Published {formatDate(build.publishedAt || build.createdAt)}
        </div>
      </div>

      {/* Unpublish Action */}
      {showConfirm ? (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-[#6e6e64]">Remove from gallery?</span>
          <button
            onClick={() => { setShowConfirm(false); onUnpublish(); }}
            disabled={loading}
            className="px-3 py-1.5 bg-rose-500 text-white text-xs font-semibold rounded-full hover:bg-rose-600 transition disabled:opacity-60"
          >
            {loading ? "..." : "Yes, remove"}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="px-3 py-1.5 bg-light text-[#6e6e64] text-xs font-medium rounded-full hover:bg-border transition"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowConfirm(true)}
          className="px-4 py-2 bg-rose-50 text-rose-700 text-xs font-semibold rounded-full hover:bg-rose-100 transition shrink-0"
        >
          Unpublish
        </button>
      )}
    </div>
  );
}
