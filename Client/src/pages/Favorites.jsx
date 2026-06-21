import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { getFavorites } from "../api/favorite.api";
import { useFavorites } from "../context/FavoritesContext";
import ProductCard from "../components/store/ProductCard";
import HeartButton from "../components/ui/HeartButton";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Heart, Tag, MapPin, ArrowRight, Info, Package, ChevronLeft, ChevronRight } from "lucide-react";

const petStatusColors = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-100",
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  sold: "bg-slate-100 text-slate-500 border-slate-200",
  adopted: "bg-blue-50 text-blue-700 border-blue-100",
  removed: "bg-rose-50 text-rose-700 border-rose-100",
};

export default function Favorites() {
  const { isFavorited } = useFavorites();
  const [activeTab, setActiveTab] = useState("listing"); // "listing" (Pets) or "product" (Store)
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });

  const fetchFavs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getFavorites({ itemType: activeTab, page, limit: 12 });
      setFavorites(res.data.data || []);
      setPagination(res.data.meta?.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 });
    } catch (err) {
      console.error("Failed to fetch favorites:", err);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  useEffect(() => {
    fetchFavs();
  }, [fetchFavs]);

  // Dynamically filter favorites that are still favorited in the context
  // This provides an instant reactive removal when the user clicks the heart
  const visibleFavorites = favorites.filter((fav) =>
    isFavorited(fav.itemType, fav.itemId)
  );

  return (
    <div className="favorites-page pb-24">
      {/* Header */}
      <Motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[11px] font-black uppercase tracking-widest border border-rose-100 flex items-center gap-1.5">
            <Heart size={12} className="fill-rose-600 text-rose-600" /> Wishlist
          </span>
        </div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-slate-900 mb-2">
          My <span className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">Favorites</span>
        </h1>
        <p className="text-slate-500 text-lg font-medium">
          Manage the pets and products you have saved for later.
        </p>
      </Motion.div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 mb-12">
        <button
          onClick={() => setActiveTab("listing")}
          className={`px-8 py-4 font-black text-sm tracking-wide transition-all border-b-2 outline-none ${
            activeTab === "listing"
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          Saved Pets 🐶
        </button>
        <button
          onClick={() => setActiveTab("product")}
          className={`px-8 py-4 font-black text-sm tracking-wide transition-all border-b-2 outline-none ${
            activeTab === "product"
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          Saved Products 🛒
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-card bg-slate-50 animate-pulse aspect-4/5" />
          ))}
        </div>
      ) : visibleFavorites.length === 0 ? (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24 bg-slate-50 border border-dashed border-slate-200 rounded-3xl"
        >
          <Heart size={48} className="mx-auto mb-4 text-slate-300" />
          <h3 className="text-2xl font-black text-slate-900 mb-2">No favorites saved</h3>
          <p className="text-slate-500 font-medium mb-8 max-w-xs mx-auto">
            {activeTab === "listing"
              ? "Browse listings in our pet marketplace and click the heart icon to save them here."
              : "Explore our store products and save items you want to buy later."}
          </p>
          <Link
            to={activeTab === "listing" ? "/marketplace" : "/products"}
            className="btn btn-primary px-8"
          >
            {activeTab === "listing" ? "Browse Marketplace" : "Explore Store"}
          </Link>
        </Motion.div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            <AnimatePresence mode="popLayout">
              {visibleFavorites.map((fav, index) => {
                const item = fav.item;

                if (!item) {
                  // Fallback for deleted items
                  return (
                    <Motion.div
                      key={fav._id}
                      layout
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="glass-card p-8 flex flex-col justify-center items-center text-center bg-slate-50 border-slate-100"
                    >
                      <Package size={32} className="text-slate-300 mb-2" />
                      <p className="text-slate-400 font-bold text-sm">Item no longer exists</p>
                      <div className="mt-4">
                        <HeartButton itemType={fav.itemType} itemId={fav.itemId} size={16} />
                      </div>
                    </Motion.div>
                  );
                }

                if (activeTab === "product") {
                  return (
                    <Motion.div
                      key={fav._id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.25 }}
                    >
                      <ProductCard product={item} />
                    </Motion.div>
                  );
                }

                // Render listing card
                return (
                  <Motion.div
                    layout
                    key={fav._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.25 }}
                    whileHover={{ y: -6 }}
                    className="glass-card overflow-hidden flex flex-col group"
                  >
                    {/* Image */}
                    <div className="relative h-64 overflow-hidden bg-slate-50">
                      <img
                        src={item.images?.[0] || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1000"}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl font-black text-primary shadow-md border border-slate-100">
                        {item.listingType === "adoption" ? "FREE" : `LKR ${item.price?.toLocaleString()}`}
                      </div>
                      <div className="absolute top-4 left-4">
                        <span className={`px-2.5 py-1 bg-white border rounded-lg text-[10px] font-black uppercase tracking-wider ${petStatusColors[item.status] || "bg-slate-50 text-slate-600"}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="absolute bottom-4 right-4 z-10">
                        <HeartButton itemType="listing" itemId={item._id} size={16} />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded uppercase tracking-wider">{item.petType}</span>
                          <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-wider ${
                            item.listingType === "sale" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                          }`}>
                            For {item.listingType}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors leading-tight">{item.title}</h3>
                      </div>

                      <div className="flex flex-wrap gap-4 text-slate-400 text-xs font-bold mb-6">
                        <span className="flex items-center gap-1.5"><Tag size={13} className="text-primary/60" /> {item.breed}</span>
                        <span className="flex items-center gap-1.5"><MapPin size={13} className="text-primary/60" /> {item.location}</span>
                      </div>

                      <div className="mt-auto pt-4 border-t border-slate-100">
                        <Link to={`/marketplace/${item._id}`} className="btn w-full bg-slate-50 text-slate-700 hover:bg-primary hover:text-white transition-all duration-300 font-black py-2.5 text-xs">
                          View Details <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </Motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-16">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-3 rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary transition-all disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`w-10 h-10 rounded-xl font-black text-sm transition-all ${
                    page === i + 1
                      ? "bg-primary text-white shadow-lg shadow-primary/30"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page === pagination.totalPages}
                className="p-3 rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary transition-all disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
