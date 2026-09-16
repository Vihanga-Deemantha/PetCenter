import React from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const CATEGORIES = ["food", "habitat", "accessories", "healthcare", "cleaning", "toys"];
const PETS = ["dog", "cat", "bird", "fish", "snake", "rabbit", "turtle", "mouse", "universal"];
const PET_ICONS = { dog: "🐕", cat: "🐈", bird: "🦜", fish: "🐟", snake: "🐍", rabbit: "🐇", turtle: "🐢", mouse: "🐭", universal: "🐾" };

const FilterSidebar = ({ filters, onChange, onClear, productCounts = {} }) => {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  const togglePet = (pet) => {
    const current = filters.compatiblePets || [];
    const updated = current.includes(pet) ? current.filter((p) => p !== pet) : [...current, pet];
    update("compatiblePets", updated);
  };

  const hasActiveFilters = filters.category || filters.compatiblePets?.length > 0 || filters.minPrice || filters.maxPrice || filters.inStock;

  return (
    <div className="bg-white border border-[#E8E2D8] rounded-card p-6 lg:sticky lg:top-28 space-y-7">
      <div className="flex items-center justify-between">
        <h3 className="m-0 font-semibold text-[13px] uppercase tracking-wider text-[#292925]">Filters</h3>
        <AnimatePresence>
          {hasActiveFilters && (
            <Motion.button
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              onClick={onClear}
              className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-primary hover:underline"
            >
              <X size={12} /> Clear all
            </Motion.button>
          )}
        </AnimatePresence>
      </div>

      <label className="flex items-center gap-3 cursor-pointer group">
        <div
          onClick={() => update("inStock", !filters.inStock)}
          className={`w-10.5 h-6 rounded-full transition-colors duration-300 flex items-center ${filters.inStock ? "bg-accent" : "bg-border"}`}
        >
          <div className={`w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform duration-300 ${filters.inStock ? "translate-x-5" : "translate-x-0.75"}`} />
        </div>
        <span className="text-sm font-medium text-[#3f3f38] group-hover:text-accent transition-colors">In stock only</span>
      </label>

      <div>
        <p className="m-0 mb-3 text-[11px] tracking-wider uppercase text-[#8a8a80] font-semibold">Category</p>
        <div className="space-y-1">
          <button
            onClick={() => update("category", "")}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors capitalize flex items-center justify-between ${
              !filters.category ? "bg-accent text-white" : "text-[#4F5B4B] hover:bg-light"
            }`}
          >
            All categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => update("category", filters.category === cat ? "" : cat)}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors capitalize flex items-center justify-between ${
                filters.category === cat ? "bg-accent text-white" : "text-[#4F5B4B] hover:bg-light"
              }`}
            >
              <span>{cat}</span>
              {productCounts[cat] != null && (
                <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${filters.category === cat ? "bg-white/20 text-white" : "bg-border text-[#8a8a80]"}`}>{productCounts[cat]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <p className="m-0 mb-3 text-[11px] tracking-wider uppercase text-[#8a8a80] font-semibold">Suited to</p>
        <div className="flex flex-wrap gap-2">
          {PETS.map((pet) => {
            const active = (filters.compatiblePets || []).includes(pet);
            return (
              <button
                key={pet}
                onClick={() => togglePet(pet)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.75 rounded-full text-[12px] font-medium border capitalize transition-colors ${
                  active ? "bg-accent text-white border-accent" : "bg-white border-border text-[#4F5B4B] hover:bg-light"
                }`}
              >
                <span>{PET_ICONS[pet]}</span> {pet}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <p className="m-0 mb-3 text-[11px] tracking-wider uppercase text-[#8a8a80] font-semibold">Price range (USD)</p>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice ? filters.minPrice / 100 : ""}
            onChange={(e) => update("minPrice", e.target.value ? Number(e.target.value) * 100 : "")}
            className="w-full px-3 py-2.25 rounded-xl border border-border text-sm text-[#3f3f38] bg-white outline-none focus:border-accent"
          />
          <span className="text-[#c9c2b3]">—</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice ? filters.maxPrice / 100 : ""}
            onChange={(e) => update("maxPrice", e.target.value ? Number(e.target.value) * 100 : "")}
            className="w-full px-3 py-2.25 rounded-xl border border-border text-sm text-[#3f3f38] bg-white outline-none focus:border-accent"
          />
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
