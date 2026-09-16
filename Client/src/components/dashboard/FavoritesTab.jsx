import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Heart, Tag, MapPin, ArrowRight, Package, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
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
      <div className="mb-7">
        <p className="text-xs tracking-[0.18em] uppercase text-accent font-semibold mb-2.5">Dashboard</p>
        <h1 className="font-heading text-[30px] sm:text-[36px] font-medium tracking-tight text-[#292925]">Saved pets &amp; products</h1>
      </div>

      <div className="flex gap-2 mb-7">
        <button
          onClick={() => setActiveTab("listing")}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-4.5 py-2.25 text-[12.5px] font-medium border transition-colors ${
            activeTab === "listing" ? "bg-secondary text-light border-secondary" : "bg-white text-secondary border-border hover:bg-light"
          }`}
        >
          Saved pets
        </button>
        <button
          onClick={() => setActiveTab("product")}
          className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-4.5 py-2.25 text-[12.5px] font-medium border transition-colors ${
            activeTab === "product" ? "bg-secondary text-light border-secondary" : "bg-white text-secondary border-border hover:bg-light"
          }`}
        >
          Saved products
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-64 bg-border rounded-[22px] animate-pulse" />)}
        </div>
      ) : fetchError || favContextError ? (
        <div className="bg-white border border-dashed border-[#dcd4c6] rounded-[22px] py-14 px-8 text-center">
          <AlertTriangle size={36} className="mx-auto mb-3.5 text-[#c9c2b3]" />
          <h3 className="font-heading text-xl font-medium mb-3">{fetchError || favContextError}</h3>
          <button onClick={() => { fetchFavs(); reloadFavContext(); }} className="btn btn-primary">Try again</button>
        </div>
      ) : visibleFavorites.length === 0 ? (
        <div className="bg-white border border-dashed border-[#dcd4c6] rounded-[22px] py-14 px-8 text-center">
          <Heart size={36} className="mx-auto mb-3.5 text-[#c9c2b3]" />
          <h3 className="font-heading text-xl font-medium mb-1.5">No favorites saved</h3>
          <p className="text-[#6e6e64] text-sm mb-6 max-w-xs mx-auto">
            {activeTab === "listing"
              ? "Browse listings in our pet marketplace and click the heart icon to save them here."
              : "Explore our store products and save items you want to buy later."}
          </p>
          <Link to={activeTab === "listing" ? "/marketplace" : "/products"} className="btn btn-primary">
            {activeTab === "listing" ? "Browse marketplace" : "Explore store"}
          </Link>
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
