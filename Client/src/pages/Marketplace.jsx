import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getListings } from "../api/listing.api";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Tag, Plus, ArrowRight, Info, SlidersHorizontal, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const statusColors = {
  active: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  sold: "bg-slate-50 text-slate-500",
  adopted: "bg-blue-50 text-blue-700",
};

const Marketplace = () => {
  const { user } = useAuth();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    petType: searchParams.get("petType") || "",
    listingType: searchParams.get("listingType") || "",
    gender: searchParams.get("gender") || "",
    location: searchParams.get("location") || "",
    search: searchParams.get("search") || "",
    page: Number(searchParams.get("page")) || 1,
  });
  const [searchInput, setSearchInput] = useState(filters.search);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchPets = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const data = await getListings(params);
      setPets(data.data);
      setPagination(data.pagination || { total: data.data.length, pages: 1, page: 1 });
    } catch (err) {
      console.error("Failed to fetch listings", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchPets(); }, [fetchPets]);

  const clearFilters = () => {
    setFilters({ petType: "", listingType: "", gender: "", location: "", search: "", page: 1 });
    setSearchInput("");
  };

  const hasFilters = Object.entries(filters).some(([k, v]) => k !== "page" && Boolean(v));

  return (
    <div className="marketplace-page pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 py-8 border-b border-slate-200 gap-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-2">
            Find Your <span className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">Perfect Match.</span>
          </h1>
          <p className="text-slate-500 text-lg">
            Browse <span className="font-black text-slate-700">{pagination.total}</span> verified pet listings from trusted owners.
          </p>
        </div>
        {user && (
          <Link to="/create-listing" className="btn btn-primary px-8">
            <Plus size={20} />
            Post a Listing
          </Link>
        )}
      </div>

      {/* Filter Bar */}
      <Motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-card p-5 mb-16 bg-white shadow-sm"
      >
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[280px] relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={20} />
            <input
              type="text"
              placeholder="Search by breed, title or description..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-14 pr-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-400 font-semibold"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Pet Type */}
            <select
              value={filters.petType}
              onChange={(e) => setFilters({ ...filters, petType: e.target.value })}
              className="px-5 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer font-semibold text-slate-700 appearance-none"
            >
              <option value="">All Species</option>
              <option value="dog">🐶 Dogs</option>
              <option value="cat">🐱 Cats</option>
              <option value="bird">🐦 Birds</option>
              <option value="fish">🐟 Fish</option>
              <option value="reptile">🦎 Reptiles</option>
              <option value="other">Other</option>
            </select>

            {/* Listing Type */}
            <select
              value={filters.listingType}
              onChange={(e) => setFilters({ ...filters, listingType: e.target.value })}
              className="px-5 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer font-semibold text-slate-700 appearance-none"
            >
              <option value="">Sale & Adoption</option>
              <option value="sale">For Sale</option>
              <option value="adoption">For Adoption</option>
            </select>

            {/* Gender */}
            <select
              value={filters.gender}
              onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
              className="px-5 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer font-semibold text-slate-700 appearance-none"
            >
              <option value="">Any Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>

            {/* Location */}
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
              <input
                type="text"
                placeholder="Location"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-40 pl-10 pr-4 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none font-semibold text-slate-700 placeholder:text-slate-400"
              />
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-4 rounded-xl bg-rose-50 text-rose-600 font-bold text-sm hover:bg-rose-100 transition-colors"
              >
                <X size={16} /> Clear
              </button>
            )}
          </div>
        </div>

        {hasFilters && (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500 font-medium">
            <SlidersHorizontal size={14} className="text-primary" />
            Filters active
            {filters.petType && <span className="badge bg-indigo-50 text-indigo-600">{filters.petType}</span>}
            {filters.listingType && <span className="badge bg-emerald-50 text-emerald-600">{filters.listingType}</span>}
            {filters.search && <span className="badge bg-purple-50 text-purple-600">"{filters.search}"</span>}
          </div>
        )}
      </Motion.div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-40">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-xl shadow-primary/30 mb-4">
            <Motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 rounded-full border-4 border-white border-t-transparent"
            />
          </div>
          <p className="mt-2 text-slate-500 font-bold text-lg">Finding the best pets for you...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            <AnimatePresence>
              {pets.map((pet, index) => (
                <Motion.div
                  layout
                  key={pet._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.35, delay: index * 0.04 }}
                  whileHover={{ y: -10 }}
                  className="glass-card overflow-hidden flex flex-col group"
                >
                  {/* Image */}
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={pet.images?.[0] || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1000"}
                      alt={pet.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl font-black text-primary shadow-xl">
                      {pet.listingType === "adoption" ? "FREE" : `LKR ${pet.price?.toLocaleString()}`}
                    </div>
                    <div className="absolute top-4 left-4">
                      <span className={`badge text-[10px] font-black uppercase tracking-wider ${statusColors[pet.status] || "bg-slate-50 text-slate-600"}`}>
                        {pet.status}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="badge bg-indigo-50 text-indigo-700">{pet.petType}</span>
                        <span className={`badge ${pet.listingType === "sale" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                          For {pet.listingType}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 group-hover:text-primary transition-colors leading-tight">{pet.title}</h3>
                    </div>

                    <div className="flex flex-wrap gap-4 text-slate-500 text-sm font-semibold mb-8">
                      <span className="flex items-center gap-2"><Tag size={16} className="text-primary/60" /> {pet.breed}</span>
                      <span className="flex items-center gap-2"><MapPin size={16} className="text-primary/60" /> {pet.location}</span>
                    </div>

                    <div className="mt-auto pt-6 border-t border-slate-100">
                      <Link to={`/marketplace/${pet._id}`} className="btn w-full bg-slate-50 text-slate-700 hover:bg-primary hover:text-white transition-all duration-300 font-black">
                        View Details <ArrowRight size={18} />
                      </Link>
                    </div>
                  </div>
                </Motion.div>
              ))}
            </AnimatePresence>
          </div>

          {pets.length === 0 && (
            <div className="text-center py-24">
              <div className="bg-slate-100 p-8 rounded-full inline-flex mb-8">
                <Info size={48} className="text-slate-400" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">No pets found</h2>
              <p className="text-slate-500 font-medium mb-8">Try adjusting your search or filters.</p>
              {hasFilters && (
                <button onClick={clearFilters} className="btn btn-primary px-8">
                  <X size={18} /> Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-3 mt-16">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setFilters((f) => ({ ...f, page: p }))}
                  className={`w-12 h-12 rounded-xl font-black transition-all ${
                    p === pagination.page
                      ? "bg-primary text-white shadow-lg shadow-indigo-500/30"
                      : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-primary"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Marketplace;
