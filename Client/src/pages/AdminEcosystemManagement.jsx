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
      <div className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2">
          🌿 Ecosystem Gallery Moderation
        </h1>
        <p className="text-slate-500">
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
          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-200 transition"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl mb-6 font-semibold text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <div className="text-5xl mb-4">🖼️</div>
          <p className="text-slate-500 font-semibold">
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
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl font-semibold text-sm shadow-xl max-w-[90vw] border ${
          toast.type === "error"
            ? "bg-red-50 text-red-700 border-red-200"
            : "bg-green-50 text-green-700 border-green-200"
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
    <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center gap-4 shadow-sm">
      {/* Icon */}
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl shrink-0">
        {icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-black text-slate-900 text-sm">{build.name}</span>
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700">
            Published
          </span>
          {build.cloneCount > 0 && (
            <span className="text-[10px] font-semibold text-primary">
              🔀 {build.cloneCount} clones
            </span>
          )}
        </div>
        <div className="text-xs text-slate-400 font-medium">
          {build.petType} setup ·{" "}
          {build.selections?.length || 0} items ·{" "}
          <strong className="text-slate-600">{formatPrice(build.totalPrice)}</strong> ·{" "}
          by <span className="text-primary font-semibold">{build.userId?.name || "Unknown"}</span>{" "}
          ({build.userId?.email || "—"}) ·{" "}
          Published {formatDate(build.publishedAt || build.createdAt)}
        </div>
      </div>

      {/* Unpublish Action */}
      {showConfirm ? (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-slate-500">Remove from gallery?</span>
          <button
            onClick={() => { setShowConfirm(false); onUnpublish(); }}
            disabled={loading}
            className="px-3 py-1.5 bg-rose-500 text-white text-xs font-black rounded-lg hover:bg-rose-600 transition disabled:opacity-60"
          >
            {loading ? "..." : "Yes, remove"}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 transition"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowConfirm(true)}
          className="px-4 py-2 bg-rose-50 text-rose-700 text-xs font-black rounded-lg hover:bg-rose-100 transition shrink-0"
        >
          Unpublish
        </button>
      )}
    </div>
  );
}
