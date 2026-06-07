import React, { useState, useEffect, useCallback } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, X, Package, Grid3X3, List, ChevronLeft, ChevronRight } from "lucide-react";
import { getProducts, getCategories } from "../api/product.api";
import ProductCard from "../components/store/ProductCard";
import FilterSidebar from "../components/store/FilterSidebar";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "bestseller", label: "Bestsellers" },
];

const Store = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: "", compatiblePets: [], minPrice: "", maxPrice: "", inStock: false,
  });

  useEffect(() => {
    getCategories().then((res) => setCategories(res.data.data || [])).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, sort };
      if (search) params.search = search;
      if (filters.category) params.category = filters.category;
      if (filters.compatiblePets?.length) params.compatiblePets = filters.compatiblePets;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.inStock) params.inStock = true;

      const res = await getProducts(params);
      setProducts(res.data.data || []);
      setPagination(res.data.pagination || {});
    } catch { setProducts([]); }
    setLoading(false);
  }, [page, sort, search, filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSearch = () => { setSearch(searchInput); setPage(1); };
  const handleClearFilters = () => {
    setFilters({ category: "", compatiblePets: [], minPrice: "", maxPrice: "", inStock: false });
    setSearch(""); setSearchInput(""); setPage(1);
  };

  const categoryCountMap = categories.reduce((acc, cat) => {
    acc[cat.name] = cat.count; return acc;
  }, {});

  const activeFilterCount = [
    filters.category, filters.inStock,
    ...(filters.compatiblePets || []),
    filters.minPrice, filters.maxPrice,
  ].filter(Boolean).length + (search ? 1 : 0);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <Motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="px-3 py-1.5 bg-indigo-50 text-primary rounded-full text-[11px] font-black uppercase tracking-widest border border-indigo-100">
            Pet Supplies
          </span>
        </div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-slate-900 mb-2">
          The <span className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">Store</span>
        </h1>
        <p className="text-slate-500 text-lg font-medium">
          Everything your pet needs — {pagination.totalItems || 0} products across 6 categories.
        </p>
      </Motion.div>

      {/* Search & Sort Bar */}
      <div className="flex flex-wrap gap-3 mb-8 items-center">
        <div className="relative flex-1 min-w-64">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white font-semibold text-sm focus:ring-2 focus:ring-primary/20 outline-none"
          />
          {searchInput && (
            <button onClick={() => { setSearchInput(""); setSearch(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm border transition-all md:hidden ${
            showFilters || activeFilterCount > 0 ? "bg-primary text-white border-primary" : "bg-white text-slate-700 border-slate-200"
          }`}
        >
          <SlidersHorizontal size={16} />
          Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </button>

        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="px-4 py-3 rounded-xl border border-slate-200 bg-white font-bold text-sm text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-8">
        {/* Sidebar — desktop always visible, mobile toggle */}
        <div className={`md:block ${showFilters ? "block" : "hidden"} md:w-64 shrink-0`}>
          <FilterSidebar
            filters={filters}
            onChange={(f) => { setFilters(f); setPage(1); }}
            onClear={handleClearFilters}
            productCounts={categoryCountMap}
          />
        </div>

        {/* Products Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="rounded-card bg-slate-100 animate-pulse aspect-4/5" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <Motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-24"
            >
              <Package size={48} className="mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-black text-slate-900 mb-2">No products found</h3>
              <p className="text-slate-500 font-medium mb-6">Try adjusting your filters or search terms.</p>
              <button onClick={handleClearFilters} className="btn btn-primary">Clear Filters</button>
            </Motion.div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {products.map((product, i) => (
                    <Motion.div
                      key={product._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <ProductCard product={product} />
                    </Motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-12">
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
                          ? "bg-primary text-white shadow-lg shadow-indigo-500/30"
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
      </div>
    </div>
  );
};

export default Store;
