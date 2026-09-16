import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Package, Shuffle, Search } from "lucide-react";
import { getGalleryBuild, cloneBuild } from "../api/ecosystem.api";
import { useAuth } from "../context/AuthContext";
import { useBuilder } from "../context/BuilderContext";
import { PET_ICONS } from "./EcosystemPicker";
import { formatPrice } from "../utils/priceFormatter";

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
      navigate(`/login?redirect=${encodeURIComponent(`/ecosystem/gallery/${id}`)}`);
      return;
    }
    setCloning(true);
    try {
      const res = await cloneBuild(id);
      const cloned = res.data.data;
      showToast("Build cloned — loading it in the builder...");
      setBuild((prev) => ({ ...prev, cloneCount: (prev.cloneCount || 0) + 1 }));
      setTimeout(() => {
        loadBuild(cloned);
        navigate(`/ecosystem/build/${cloned.petType}?step=3`);
      }, 1100);
    } catch {
      showToast("Failed to clone this build. Please try again.", "error");
    } finally {
      setCloning(false);
    }
  };

  if (loading) return <DetailSkeleton />;

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-7 pt-8 pb-24 text-center">
        <Search size={40} className="mx-auto mb-4 text-[#c9c2b3]" />
        <h2 className="font-heading text-2xl mb-2">Build not found</h2>
        <p className="text-[#6e6e64] mb-6">{error}</p>
        <Link to="/ecosystem/gallery" className="btn btn-primary">
          <ArrowLeft size={16} /> Back to gallery
        </Link>
      </div>
    );
  }

  const icon = PET_ICONS[build.petType] || "🐾";

  const grouped = {};
  for (const sel of build.selections || []) {
    if (!grouped[sel.categoryKey]) grouped[sel.categoryKey] = [];
    grouped[sel.categoryKey].push(sel);
  }

  return (
    <div className="max-w-4xl mx-auto px-7 pt-8 pb-24">
      <button onClick={() => navigate("/ecosystem/gallery")} className="flex items-center gap-1.5 text-secondary text-sm font-medium mb-5">
        <ArrowLeft size={15} /> Back to gallery
      </button>

      <div className="bg-secondary text-light rounded-[24px] px-7 sm:px-9 py-7 sm:py-8 mb-7 flex gap-5 items-start flex-wrap">
        <div className="text-[44px] leading-none">{icon}</div>
        <div className="flex-1 min-w-50">
          <p className="m-0 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#C8CFC1]">{build.petType} ecosystem</p>
          <h1 className="font-heading text-[26px] sm:text-[32px] font-medium m-0 mb-2 tracking-tight">{build.name}</h1>
          <p className="m-0 mb-4 text-[13px] text-[#DCE0D6]">
            by <strong className="text-white">{build.userId?.name || "Anonymous"}</strong> · {build.selections?.length || 0} items
            {build.cloneCount > 0 && (
              <>
                {" "}
                · {build.cloneCount} {build.cloneCount === 1 ? "person" : "people"} built this
              </>
            )}
          </p>

          <div className="flex items-center gap-5 flex-wrap">
            <div>
              <p className="m-0 text-[11px] font-semibold text-[#C8CFC1] uppercase tracking-wider">Total cost</p>
              <p className="m-0 mt-0.5 font-heading text-2xl font-medium">{formatPrice(build.totalPrice)}</p>
            </div>
            <button onClick={handleClone} disabled={cloning} className="btn btn-primary px-6.5 py-3.25">
              {cloning ? "Cloning..." : !user ? "Log in to clone" : (
                <>
                  <Shuffle size={15} /> Clone this build
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {Object.entries(grouped).map(([categoryKey, selections]) => (
        <CategoryGroup key={categoryKey} categoryKey={categoryKey} selections={selections} />
      ))}

      <AnimatePresence>
        {toast && (
          <Motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed left-1/2 bottom-7 -translate-x-1/2 z-120 rounded-full px-5.5 py-3.25 text-sm font-medium shadow-xl"
            style={toast.type === "error" ? { background: "#F7E9DF", color: "#8f4a28" } : { background: "#292925", color: "#F7F4ED" }}
          >
            {toast.msg}
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CategoryGroup({ categoryKey, selections }) {
  const label = categoryKey.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <div className="mb-6">
      <p className="m-0 mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#8a8a80]">{label}</p>
      <div className="flex flex-col gap-2.5">
        {selections.map((sel, i) => (
          <SelectionRow key={i} sel={sel} />
        ))}
      </div>
    </div>
  );
}

function SelectionRow({ sel }) {
  const { productSnapshot } = sel;
  return (
    <div className="flex items-center gap-3.5 bg-white border border-[#E8E2D8] rounded-2xl px-4 py-3">
      <div className="w-13 h-13 rounded-xl overflow-hidden bg-light shrink-0">
        {productSnapshot?.image ? (
          <img src={productSnapshot.image} alt={productSnapshot.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={18} className="text-[#c9c2b3]" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="m-0 text-sm font-semibold text-[#292925] truncate">{productSnapshot?.name || "Unknown product"}</p>
        <p className="m-0 mt-0.5 text-[13px] font-semibold text-primary">{formatPrice(productSnapshot?.price || 0)}</p>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-7 pt-8 pb-24">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={`bg-border rounded-2xl animate-pulse mb-4 ${i === 1 ? "h-36" : "h-16"}`} />
      ))}
    </div>
  );
}
