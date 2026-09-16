import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, X, Package, ChevronLeft, ChevronRight, Utensils, Sofa, Gamepad2, Sparkles, HeartPulse, Home } from "lucide-react";
import { getProducts, getCategories } from "../api/product.api";
import ProductCard from "../components/store/ProductCard";
import FilterSidebar from "../components/store/FilterSidebar";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "bestseller", label: "Bestsellers" },
];

const CATEGORY_TILES = [
  { key: "food", label: "Food & treats", icon: Utensils },
  { key: "accessories", label: "Beds & furniture", icon: Sofa },
  { key: "toys", label: "Toys & play", icon: Gamepad2 },
  { key: "cleaning", label: "Grooming", icon: Sparkles },
  { key: "healthcare", label: "Health", icon: HeartPulse },
  { key: "habitat", label: "Habitat", icon: Home },
];

const PROMO_TILES = [
  { key: "accessories", title: "Rest & relax", desc: "Comfort-first beds and furniture for better sleep.", icon: Sofa },
  { key: "cleaning", title: "Clean & natural", desc: "Gentle grooming care for their daily routine.", icon: Sparkles },
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
  const [filters, setFilters] = useState({ category: "", compatiblePets: [], minPrice: "", maxPrice: "", inStock: false });
  const [featured, setFeatured] = useState(null);
  const gridRef = useRef(null);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data.data || []))
      .catch(() => {});
    getProducts({ sort: "bestseller", limit: 1 })
      .then((res) => setFeatured(res.data.data?.[0] || null))
      .catch(() => {});
  }, []);

  const pickCategory = (key) => {
    setFilters((f) => ({ ...f, category: f.category === key ? "" : key }));
    setPage(1);
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
    } catch {
      setProducts([]);
    }
    setLoading(false);
  }, [page, sort, search, filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };
  const handleClearFilters = () => {
    setFilters({ category: "", compatiblePets: [], minPrice: "", maxPrice: "", inStock: false });
    setSearch("");
    setSearchInput("");
    setPage(1);
  };

  const categoryCountMap = categories.reduce((acc, cat) => {
    acc[cat.name] = cat.count;
    return acc;
  }, {});

  const activeFilterCount = [filters.category, filters.inStock, ...(filters.compatiblePets || []), filters.minPrice, filters.maxPrice].filter(Boolean).length + (search ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-7 pb-24">
      <Motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="pt-13 pb-11 border-b border-border mb-9 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-12 lg:gap-14 items-center">
        <div>
          <p className="text-xs tracking-[0.18em] uppercase text-accent font-semibold mb-3.5">The store</p>
          <h1 className="font-heading text-[38px] sm:text-[52px] font-medium mb-3.5 tracking-tight leading-[1.06]">
            Essentials,
            <br />
            <span className="italic text-accent">quietly made</span>
          </h1>
          <p className="text-[15px] leading-relaxed text-[#5c5c54] max-w-130 mb-7">
            A small catalogue chosen for durability and comfort — <span className="font-semibold text-[#292925]">{pagination.totalItems || 0}</span> products across 6 categories.
          </p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} className="btn bg-accent text-white hover:bg-secondary px-7 py-3.75">
              Shop all products
            </button>
            <Link to="/ecosystem" className="btn border border-[#cfc8ba] text-secondary hover:bg-[#E8E2D8] px-7 py-3.75">
              Build a habitat
            </Link>
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="relative rounded-[26px] overflow-hidden bg-border border border-[#dcd4c6] aspect-4/3">
            {featured?.images?.[0]?.url ? (
              <img src={featured.images[0].url} alt={featured.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package size={48} className="text-[#c9c2b3]" />
              </div>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-[#292925]/34 to-transparent pointer-events-none" />
            {featured && (
              <div className="absolute left-6 bottom-5.5 pointer-events-none">
                <p className="m-0 text-[11px] tracking-[0.14em] uppercase text-[#E8E2D8]">Loved this month</p>
                <p className="mt-1.25 mb-0 font-heading text-2xl font-medium text-white">{featured.name}</p>
              </div>
            )}
          </div>
          <div className="absolute -left-6 top-7 bg-light border border-border rounded-2xl px-4.5 py-3.5 shadow-xl shadow-black/10 max-w-56">
            <p className="m-0 text-[11px] tracking-wider uppercase text-accent">Our promise</p>
            <p className="mt-0.75 mb-0 text-sm font-semibold text-[#292925]">Every order supports a partner shelter</p>
          </div>
        </div>
      </Motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-11">
        {CATEGORY_TILES.map((tile) => {
          const Icon = tile.icon;
          const active = filters.category === tile.key;
          return (
            <button
              key={tile.key}
              onClick={() => pickCategory(tile.key)}
              className={`flex flex-col items-center gap-2.5 rounded-2xl border px-3.5 py-5 transition-colors ${
                active ? "bg-accent border-accent text-white" : "bg-white border-border text-[#3f3f38] hover:border-[#cfc8ba]"
              }`}
            >
              <Icon size={22} className={active ? "text-white" : "text-accent"} />
              <span className="text-xs font-medium text-center leading-snug">{tile.label}</span>
            </button>
          );
        })}
      </div>

      <div ref={gridRef} className="flex flex-wrap gap-3 mb-7 items-center">
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-[#8a8a80]" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full pl-11 pr-4 py-3.25 rounded-full border border-border bg-white text-sm text-[#292925] outline-none focus:border-accent"
          />
          {searchInput && (
            <button onClick={() => { setSearchInput(""); setSearch(""); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8a8a80] hover:text-[#292925]">
              <X size={15} />
            </button>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4.5 py-3.25 rounded-full font-medium text-sm border transition-colors ${
              showFilters || activeFilterCount > 0 ? "bg-accent text-white border-accent" : "bg-white text-[#3f3f38] border-border"
            }`}
          >
            <SlidersHorizontal size={15} />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>

          <AnimatePresence>
            {showFilters && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowFilters(false)} />
                <Motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute left-0 top-full mt-2 z-40 w-80 max-w-[90vw] max-h-[70vh] overflow-y-auto"
                >
                  <FilterSidebar filters={filters} onChange={(f) => { setFilters(f); setPage(1); }} onClear={handleClearFilters} productCounts={categoryCountMap} />
                </Motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="px-4.5 py-3.25 rounded-full border border-border bg-white font-medium text-sm text-[#3f3f38] outline-none cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="rounded-card bg-border animate-pulse aspect-4/5" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <Package size={40} className="mx-auto mb-4 text-[#c9c2b3]" />
              <h3 className="font-heading text-xl text-[#292925] mb-2">No products found</h3>
              <p className="text-[#6e6e64] mb-6">Try adjusting your filters or search terms.</p>
              <button onClick={handleClearFilters} className="btn btn-primary">
                Clear filters
              </button>
            </Motion.div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {products.map((product, i) => (
                    <Motion.div key={product._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ delay: i * 0.04 }}>
                      <ProductCard product={product} />
                    </Motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-2.5 mt-12">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-2.75 rounded-full border border-border bg-white text-[#4F5B4B] hover:border-accent transition-colors disabled:opacity-40"
                  >
                    <ChevronLeft size={17} />
                  </button>
                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={`w-10 h-10 rounded-full font-medium text-sm transition-colors ${
                        page === i + 1 ? "bg-accent text-white" : "border border-border bg-white text-[#4F5B4B] hover:border-accent"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                    disabled={page === pagination.totalPages}
                    className="p-2.75 rounded-full border border-border bg-white text-[#4F5B4B] hover:border-accent transition-colors disabled:opacity-40"
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
              )}
            </>
          )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-16">
        {PROMO_TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <button
              key={tile.key}
              onClick={() => pickCategory(tile.key)}
              className="text-left bg-white border border-border rounded-card overflow-hidden flex flex-col hover:border-[#cfc8ba] transition-colors"
            >
              <div className="aspect-3/2 bg-light flex items-center justify-center">
                <Icon size={36} className="text-accent" />
              </div>
              <div className="p-5.5">
                <p className="m-0 font-heading text-xl font-medium text-[#292925]">{tile.title}</p>
                <p className="mt-2 mb-0 text-sm text-[#6e6e64]">{tile.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Store;
