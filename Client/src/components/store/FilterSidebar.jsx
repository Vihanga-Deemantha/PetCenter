import React from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";

const CATEGORIES = ["food", "habitat", "accessories", "healthcare", "cleaning", "toys"];
const PETS = ["dog", "cat", "bird", "fish", "snake", "rabbit", "turtle", "mouse", "universal"];
const PET_ICONS = { dog: "🐕", cat: "🐈", bird: "🦜", fish: "🐟", snake: "🐍", rabbit: "🐇", turtle: "🐢", mouse: "🐭", universal: "🐾" };

const FilterSidebar = ({ filters, onChange, onClear, productCounts = {} }) => {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  const togglePet = (pet) => {
    const current = filters.compatiblePets || [];
    const updated = current.includes(pet)
      ? current.filter((p) => p !== pet)
      : [...current, pet];
    update("compatiblePets", updated);
  };

  const hasActiveFilters =
    filters.category || (filters.compatiblePets?.length > 0) ||
    filters.minPrice || filters.maxPrice || filters.inStock;

  return (
    <div className="glass-card bg-white border-slate-100 shadow-sm p-6 sticky top-28 space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-primary" />
          <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">Filters</h3>
        </div>
        <AnimatePresence>
          {hasActiveFilters && (
            <Motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={onClear}
              className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-rose-500 hover:text-rose-700 transition-colors"
            >
              <X size={12} /> Clear All
            </Motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* In Stock */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer group">
          <div
            onClick={() => update("inStock", !filters.inStock)}
            className={`w-11 h-6 rounded-full transition-all duration-300 flex items-center ${
              filters.inStock ? "bg-primary" : "bg-slate-200"
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${
              filters.inStock ? "translate-x-6" : "translate-x-0.5"
            }`} />
          </div>
          <span className="font-bold text-sm text-slate-700 group-hover:text-primary transition-colors">In Stock Only</span>
        </label>
      </div>

      {/* Category */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Category</p>
        <div className="space-y-1.5">
          <button
            onClick={() => update("category", "")}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-all capitalize flex items-center justify-between ${
              !filters.category ? "bg-primary text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span>All Categories</span>
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => update("category", filters.category === cat ? "" : cat)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-all capitalize flex items-center justify-between ${
                filters.category === cat ? "bg-primary text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>{cat}</span>
              {productCounts[cat] != null && (
                <span className={`text-[11px] font-black rounded-full px-2 py-0.5 ${
                  filters.category === cat ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
                }`}>
                  {productCounts[cat]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Compatible Pets */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Pet Type</p>
        <div className="grid grid-cols-3 gap-2">
          {PETS.map((pet) => {
            const active = (filters.compatiblePets || []).includes(pet);
            return (
              <button
                key={pet}
                onClick={() => togglePet(pet)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[11px] font-black transition-all border capitalize ${
                  active
                    ? "bg-indigo-50 border-primary text-primary"
                    : "border-slate-100 text-slate-500 hover:border-indigo-200 hover:bg-indigo-50/30"
                }`}
              >
                <span className="text-base">{PET_ICONS[pet]}</span>
                <span>{pet}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Price Range (USD)</p>
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice || ""}
              onChange={(e) => update("minPrice", e.target.value ? Number(e.target.value) * 100 : "")}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none bg-white"
            />
          </div>
          <span className="text-slate-300 font-bold">—</span>
          <div className="flex-1">
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice || ""}
              onChange={(e) => update("maxPrice", e.target.value ? Number(e.target.value) * 100 : "")}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
