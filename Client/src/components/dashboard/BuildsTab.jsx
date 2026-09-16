import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Boxes, ShoppingCart, Globe, Trash2, Play } from "lucide-react";
import { getMyBuilds, deleteBuild, togglePublish, bulkAddToCart } from "../../api/ecosystem.api";
import { useBuilder } from "../../context/BuilderContext";
import { useCart } from "../../context/CartContext";
import { PET_ICONS } from "../../pages/EcosystemPicker";
import { formatPrice } from "../../utils/priceFormatter";

const formatDate = (iso) => new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

export default function BuildsTab() {
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

  useEffect(() => { fetchBuilds(); }, [fetchBuilds]);

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
      if (failed.length === 0) showToast(`${added.length} items from "${build.name}" added to cart.`);
      else showToast(`${added.length} added, ${failed.length} unavailable.`, "warning");
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
      showToast(updated.isPublished ? "Build is now public in the gallery." : "Build removed from gallery.");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update publish status.", "error");
    }
  };

  return (
    <div>
      <div className="mb-7 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs tracking-[0.18em] uppercase text-accent font-semibold mb-2.5">Dashboard</p>
          <h1 className="font-heading text-[30px] sm:text-[36px] font-medium tracking-tight text-[#292925]">Habitat builds</h1>
        </div>
        <Link to="/ecosystem" className="btn btn-primary px-5 py-2.5 text-sm shrink-0">
          New build
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-border rounded-2xl animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-[#F7E9DF] rounded-2xl text-[#8f4a28]">{error}</div>
      ) : builds.length === 0 ? (
        <div className="bg-white border border-dashed border-[#dcd4c6] rounded-[22px] py-14 px-8 text-center">
          <Boxes size={36} className="mx-auto mb-3.5 text-[#c9c2b3]" />
          <h3 className="font-heading text-xl font-medium mb-1.5">No builds yet</h3>
          <p className="text-[#6e6e64] text-sm mb-6 max-w-xs mx-auto">Start building a setup for your pet and save it here.</p>
          <Link to="/ecosystem" className="btn btn-primary">Start building</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
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

      <AnimatePresence>
        {confirmDelete && (
          <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#292925]/40 backdrop-blur-sm p-4">
            <Motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[26px] shadow-2xl max-w-sm w-full p-8 border border-border">
              <h3 className="font-heading text-xl mb-2">Delete this build?</h3>
              <p className="text-[#6e6e64] text-sm mb-6 leading-relaxed">This action cannot be undone. Your build will be permanently removed.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 bg-light text-secondary rounded-full font-medium hover:bg-border transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary-dark transition-colors">
                  Delete
                </button>
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <Motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed left-1/2 bottom-7 -translate-x-1/2 z-120 rounded-full px-5.5 py-3.25 text-sm font-medium shadow-xl"
            style={toast.type === "error" ? { background: "#F7E9DF", color: "#8f4a28" } : toast.type === "warning" ? { background: "#F7E9DF", color: "#8f4a28" } : { background: "#292925", color: "#F7F4ED" }}
          >
            {toast.msg}
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
    <div className="bg-white border border-[#E8E2D8] rounded-2xl px-5 py-4.5 flex gap-4 items-start">
      <div className="w-12.5 h-12.5 rounded-xl bg-accent/10 flex items-center justify-center text-2xl shrink-0">{icon}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-heading text-[16px] font-medium text-[#292925]">{build.name}</span>
          {build.isPublished && (
            <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold bg-[#E9EDE4] text-[#40543C] px-2.25 py-0.75 rounded-full">
              <Globe size={10} /> Published
            </span>
          )}
        </div>
        <p className="m-0 mb-3 text-[12.5px] text-[#8a8a80] capitalize">
          {build.petType} · {build.selections?.length || 0} items ·{" "}
          <strong className="text-secondary font-semibold">{formatPrice(build.totalPrice)}</strong> · Saved {formatDate(build.createdAt)}
        </p>

        <div className="flex gap-2 flex-wrap">
          <button onClick={onLoad} className="inline-flex items-center gap-1.5 px-3.5 py-1.75 rounded-full text-xs font-medium bg-secondary text-light hover:bg-[#3f4a3c] transition-colors">
            <Play size={12} /> Load build
          </button>
          <button onClick={handleCart} disabled={cartLoading} className="inline-flex items-center gap-1.5 px-3.5 py-1.75 rounded-full text-xs font-medium bg-accent/10 text-secondary hover:bg-accent/20 transition-colors">
            <ShoppingCart size={12} /> {cartLoading ? "Adding…" : "Add to cart"}
          </button>
          <button onClick={handlePublish} disabled={publishLoading} className="inline-flex items-center gap-1.5 px-3.5 py-1.75 rounded-full text-xs font-medium border border-border text-secondary hover:bg-light transition-colors">
            <Globe size={12} /> {publishLoading ? "…" : build.isPublished ? "Remove from gallery" : "Share to gallery"}
          </button>
          <button onClick={onDelete} className="inline-flex items-center gap-1.5 px-3.5 py-1.75 rounded-full text-xs font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors">
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
