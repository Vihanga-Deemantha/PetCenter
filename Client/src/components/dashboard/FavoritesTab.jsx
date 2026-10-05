import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Heart, Tag, MapPin, ArrowRight, Package, ChevronLeft, ChevronRight, AlertTriangle, PawPrint, BookmarkCheck } from "lucide-react";
import { getFavorites } from "../../api/favorite.api";
import { useFavorites } from "../../context/FavoritesContext";
import ProductCard from "../store/ProductCard";
import HeartButton from "../ui/HeartButton";

const STATUS_TINT = {
  active: "bg-[#E9EDE4] text-[#40543C] border-[#d9e2d0]",
  pending: "bg-[#F7E9DF] text-[#8f4a28] border-[#f0d9c5]",
  sold: "bg-[#EFEBE2] text-[#6e6e64] border-[#E8E2D8]",
  adopted: "bg-[#E4EAF2] text-[#31506f] border-[#d3ddea]",
  removed: "bg-rose-50 text-rose-700 border-rose-100",
};

export default function FavoritesTab() {
  const { isFavorited, error: favContextError, reload: reloadFavContext } = useFavorites();
  const [activeTab, setActiveTab] = useState("listing");
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });

  const fetchFavs = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await getFavorites({ itemType: activeTab, page, limit: 9 });
      setFavorites(res.data.data || []);
      setPagination(res.data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 });
    } catch {
      setFavorites([]);
      setFetchError("Couldn't load your favorites. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => { setPage(1); }, [activeTab]);
  useEffect(() => { fetchFavs(); }, [fetchFavs]);

  const visibleFavorites = favorites.filter((fav) => isFavorited(fav.itemType, fav.itemId));

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Your account</p>
          <h1 className="font-heading text-[34px] sm:text-[42px] font-medium tracking-[-0.025em] leading-[1.05] text-[#292925]">Saved pets &amp; products</h1>
          <p className="mt-3 max-w-xl text-sm sm:text-[15px] leading-6 text-[#6e6e64]">
            Keep promising companions and useful products close until you are ready.
          </p>
        </div>
        {!loading && !fetchError && !favContextError && (
          <div className="flex w-fit items-baseline gap-2 rounded-xl border border-[#E8E2D8] bg-white px-4 py-2.5 shadow-[0_4px_16px_rgba(72,65,52,0.035)]">
            <span className="font-heading text-2xl font-medium text-[#292925]">{pagination.totalItems || 0}</span>
            <span className="text-xs font-medium text-[#8a8a80]">saved {activeTab === "listing" ? "pets" : "products"}</span>
          </div>
        )}
      </div>

      <div className="mb-7 flex w-fit max-w-full gap-1.5 overflow-x-auto rounded-2xl border border-[#E8E2D8] bg-white/80 p-2 shadow-[0_5px_20px_rgba(72,65,52,0.03)]">
        <button
          type="button"
          aria-pressed={activeTab === "listing"}
          onClick={() => setActiveTab("listing")}
          className={`inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-[12.5px] font-medium transition-all ${
            activeTab === "listing" ? "bg-secondary text-light shadow-[0_5px_14px_rgba(64,84,60,0.18)]" : "text-secondary hover:bg-light"
          }`}
        >
          <PawPrint size={14} /> Saved pets
        </button>
        <button
          type="button"
          aria-pressed={activeTab === "product"}
          onClick={() => setActiveTab("product")}
          className={`inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-[12.5px] font-medium transition-all ${
            activeTab === "product" ? "bg-secondary text-light shadow-[0_5px_14px_rgba(64,84,60,0.18)]" : "text-secondary hover:bg-light"
          }`}
        >
          <Package size={14} /> Saved products
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2" aria-label="Loading saved items">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-64 animate-pulse rounded-[22px] border border-[#E8E2D8] bg-white" />)}
        </div>
      ) : fetchError || favContextError ? (
        <div className="rounded-[24px] border border-[#E8E2D8] bg-white px-6 py-12 text-center shadow-[0_14px_40px_rgba(72,65,52,0.055)] sm:py-16">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <AlertTriangle size={25} strokeWidth={1.8} />
          </div>
          <h3 className="font-heading text-2xl font-medium text-[#292925]">Saved items couldn&apos;t load</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6e6e64]">{fetchError || favContextError}</p>
          <button onClick={() => { fetchFavs(); reloadFavContext(); }} className="btn btn-primary mt-6">Try again</button>
        </div>
      ) : visibleFavorites.length === 0 ? (
        <div className="overflow-hidden rounded-[24px] border border-[#E8E2D8] bg-white shadow-[0_14px_40px_rgba(72,65,52,0.055)]">
          <div className="grid lg:grid-cols-[1fr_280px]">
            <div className="px-6 py-11 text-center sm:px-10 sm:py-14 lg:text-left">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-secondary lg:mx-0">
                {activeTab === "listing" ? <PawPrint size={29} strokeWidth={1.55} /> : <Package size={29} strokeWidth={1.55} />}
              </div>
              <h2 className="font-heading text-2xl font-medium text-[#292925] sm:text-[28px]">
                {activeTab === "listing" ? "No saved pets yet" : "No saved products yet"}
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#6e6e64] sm:text-[15px] lg:mx-0">
                {activeTab === "listing"
                  ? "Save pets that catch your eye so you can compare their details and return when the time feels right."
                  : "Keep useful products together here while you compare options or plan your next purchase."}
              </p>
              <Link to={activeTab === "listing" ? "/marketplace" : "/products"} className="btn btn-primary mt-6">
                {activeTab === "listing" ? "Browse marketplace" : "Explore the store"}
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="flex items-center justify-center border-t border-[#E8E2D8] bg-light/65 px-8 py-8 lg:border-t-0 lg:border-l">
              <div className="max-w-[210px] text-center">
                <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-[#dcd4c6] bg-white text-primary shadow-[0_8px_22px_rgba(72,65,52,0.06)]">
                  <BookmarkCheck size={29} strokeWidth={1.5} />
                  <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-light">
                    <Heart size={12} fill="currentColor" />
                  </span>
                </div>
                <p className="text-[12.5px] font-semibold text-[#4f4f48]">Save now, decide later</p>
                <p className="mt-1 text-[11.5px] leading-5 text-[#8a8a80]">Use the heart button anywhere you see it to build your shortlist.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <AnimatePresence mode="popLayout">
              {visibleFavorites.map((fav) => {
                const item = fav.item;

                if (!item) {
                  return (
                    <Motion.div key={fav._id} layout exit={{ opacity: 0, scale: 0.9 }} className="bg-light border border-border rounded-[22px] p-7 flex flex-col justify-center items-center text-center">
                      <Package size={26} className="text-[#c9c2b3] mb-2" />
                      <p className="text-[#8a8a80] font-medium text-sm mb-3">Item no longer exists</p>
                      <HeartButton itemType={fav.itemType} itemId={fav.itemId} size={16} />
                    </Motion.div>
                  );
                }

                if (activeTab === "product") {
                  return (
                    <Motion.div key={fav._id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
                      <ProductCard product={item} />
                    </Motion.div>
                  );
                }

                return (
                  <Motion.div
                    layout
                    key={fav._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white border border-[#E8E2D8] rounded-[22px] overflow-hidden flex flex-col group"
                  >
                    <div className="relative h-44 overflow-hidden bg-light">
                      <img
                        src={item.images?.[0] || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1000"}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3.5 right-3.5 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full font-semibold text-primary text-xs border border-[#E8E2D8]">
                        {item.listingType === "adoption" ? "Free" : `LKR ${item.price?.toLocaleString()}`}
                      </div>
                      <div className="absolute top-3.5 left-3.5">
                        <span className={`px-2.25 py-1 border rounded-full text-[10px] font-semibold uppercase tracking-wider ${STATUS_TINT[item.status] || "bg-light text-[#6e6e64] border-border"}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="absolute bottom-3.5 right-3.5 z-10">
                        <HeartButton itemType="listing" itemId={item._id} size={15} />
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-accent/10 text-secondary text-[10px] font-semibold rounded-full uppercase tracking-wider">{item.petType}</span>
                      </div>
                      <h3 className="m-0 mb-3.5 font-heading text-[17px] font-medium text-[#292925] truncate">{item.title}</h3>
                      <div className="flex flex-wrap gap-3 text-[#8a8a80] text-xs font-medium mb-4">
                        <span className="flex items-center gap-1.25"><Tag size={12} /> {item.breed}</span>
                        <span className="flex items-center gap-1.25"><MapPin size={12} /> {item.location}</span>
                      </div>
                      <Link to={`/marketplace/${item._id}`} className="mt-auto btn border border-border text-secondary hover:bg-light w-full text-xs py-2.5">
                        View details <ArrowRight size={13} />
                      </Link>
                    </div>
                  </Motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2.5 mt-8">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2.5 rounded-full border border-border bg-white text-secondary hover:border-[#cfc8ba] disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 rounded-full text-sm font-semibold transition-colors ${
                    page === i + 1 ? "bg-secondary text-light" : "border border-border bg-white text-secondary hover:bg-light"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage(Math.min(pagination.totalPages, page + 1))} disabled={page === pagination.totalPages} className="p-2.5 rounded-full border border-border bg-white text-secondary hover:border-[#cfc8ba] disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
