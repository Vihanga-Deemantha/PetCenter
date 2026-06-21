import React from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ShoppingCart, ChevronRight, Package, Box, Info, Activity, Shield } from "lucide-react";

const StorePreviewSection = () => {
  const categories = [
    { name: "Premium Food", icon: <Package size={24} />, count: "120+ Items", color: "text-amber-500", bg: "bg-amber-50" },
    { name: "Habitat Kits", icon: <Box size={24} />, count: "45+ Sets", color: "text-primary", bg: "bg-primary/10" },
    { name: "Expert Lighting", icon: <Activity size={24} />, count: "30+ Models", color: "text-teal-500", bg: "bg-teal-50" },
    { name: "Health Care", icon: <Shield size={24} />, count: "80+ Products", color: "text-emerald-500", bg: "bg-emerald-50" }
  ];

  return (
    <section className="py-32 bg-white relative">
      <div className="max-w-7xl mx-auto px-[5%]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 gap-8">
          <div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-950 tracking-tighter mb-4 leading-tight">
              Everything they need, <br/> in one place.
            </h2>
            <p className="text-slate-500 text-lg max-w-xl font-medium font-secondary">
              Shop curated essentials, from bio-active substrates to smart temperature systems. 
              Only the highest quality brands for your companions.
            </p>
          </div>
          <Link to="/products" className="btn btn-primary px-8 py-4 rounded-xl flex items-center gap-3 shadow-xl shadow-primary/20 hover:shadow-primary/30 group">
            Shop Store <ShoppingCart size={20} className="transition-transform group-hover:scale-110" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((cat, i) => (
            <Motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -10 }}
              className="glass-card p-10 bg-white border-slate-100 shadow-sm relative overflow-hidden group cursor-pointer"
            >
              <div className={`p-5 rounded-2xl ${cat.bg} ${cat.color} mb-12 inline-block transition-transform group-hover:rotate-12 duration-500`}>
                {cat.icon}
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">{cat.name}</h3>
              <p className="text-slate-400 font-bold text-sm tracking-wide mb-8">{cat.count}</p>
              
              <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                Browse Category <ChevronRight size={14} />
              </div>
            </Motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StorePreviewSection;
