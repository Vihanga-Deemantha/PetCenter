import React from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ShoppingCart, Package, Star, Shield, Zap, ArrowRight } from "lucide-react";

const upcomingCategories = [
  { name: "Premium Food", icon: <Package size={28} />, desc: "Curated nutrition for every species", color: "text-amber-500", bg: "bg-amber-50", items: "120+ Items" },
  { name: "Habitat Kits", icon: <Shield size={28} />, desc: "Complete bio-active setups", color: "text-primary", bg: "bg-primary/10", items: "45+ Sets" },
  { name: "Smart Lighting", icon: <Zap size={28} />, desc: "Expert UV & heat systems", color: "text-teal-500", bg: "bg-teal-50", items: "30+ Models" },
  { name: "Health & Care", icon: <Star size={28} />, desc: "Supplements, treatments & tools", color: "text-emerald-500", bg: "bg-emerald-50", items: "80+ Products" },
];

const Products = () => {
  return (
    <div className="products-page pb-24">
      {/* Header */}
      <div className="mb-16 py-8 border-b border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-4 py-2 bg-amber-50 text-amber-600 rounded-full text-xs font-black uppercase tracking-widest border border-amber-100">
            Coming in Phase 2
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
          Premium Pet <span className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">Store</span>
        </h1>
        <p className="text-slate-500 text-xl font-medium max-w-2xl">
          Everything your pet needs — from biologically-appropriate nutrition to smart habitat systems.
          Our full product store is coming very soon.
        </p>
      </div>

      {/* Coming Soon Visual */}
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-12 md:p-20 text-center bg-white shadow-sm mb-16"
      >
        <Motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="inline-flex items-center justify-center w-28 h-28 bg-linear-to-br from-primary to-accent rounded-[32px] shadow-2xl shadow-primary/30 mb-10"
        >
          <ShoppingCart size={48} className="text-white" />
        </Motion.div>

        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter mb-4">
          We're stocking the shelves
        </h2>
        <p className="text-slate-500 text-lg font-medium max-w-lg mx-auto mb-10">
          Our team is carefully curating the highest quality pet supplies from verified brands.
          Check back soon for the full launch.
        </p>

        <Link to="/marketplace" className="btn btn-primary px-10 py-4 text-lg group">
          Browse Pet Listings <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </Motion.div>

      {/* Category Previews */}
      <div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter mb-8">
          What to expect
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {upcomingCategories.map((cat, i) => (
            <Motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8 }}
              className="glass-card p-8 bg-white border-slate-100 shadow-sm group"
            >
              <div className={`w-14 h-14 rounded-2xl ${cat.bg} ${cat.color} flex items-center justify-center mb-6 transition-transform group-hover:rotate-12 duration-500`}>
                {cat.icon}
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">{cat.name}</h3>
              <p className="text-slate-500 font-medium text-sm mb-4">{cat.desc}</p>
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">{cat.items}</span>
            </Motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Products;
