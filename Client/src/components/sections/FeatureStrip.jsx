import React from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ShoppingCart, Heart, Plus, Tag, Search } from "lucide-react";

const FeatureStrip = () => {
  const cards = [
    { 
      icon: <Search className="text-emerald-500" />, 
      title: "Buy Pets", 
      desc: "Find your pet",
      path: "/marketplace",
      bg: "bg-emerald-50"
    },
    { 
      icon: <Tag className="text-indigo-500" />, 
      title: "Sell Pets", 
      desc: "List your pets",
      path: "/create-listing",
      bg: "bg-indigo-50"
    },
    { 
      icon: <ShoppingCart className="text-amber-500" />, 
      title: "Shop Essentials", 
      desc: "Pet supplies",
      path: "/products",
      bg: "bg-amber-50"
    },
    { 
      icon: <Heart className="text-rose-500" />, 
      title: "Help Animals", 
      desc: "Support rescues",
      path: "/campaigns",
      bg: "bg-rose-50"
    },
    { 
      icon: <Plus className="text-teal-500" />, 
      title: "Build Habitat", 
      desc: "Custom designs",
      path: "/ecosystem",
      bg: "bg-teal-50"
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <section className="py-20 px-[5%] max-w-7xl mx-auto">
      <Motion.div 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6"
      >
        {cards.map((card, i) => (
          <Link key={i} to={card.path}>
            <Motion.div 
              variants={item}
              whileHover={{ y: -10, scale: 1.02 }}
              className="glass-card p-8 flex flex-col items-center text-center gap-6 bg-white border-slate-100 shadow-sm transition-all shadow-indigo-500/5 cursor-pointer group"
            >
              <div className={`p-5 rounded-2xl ${card.bg} transition-transform group-hover:scale-110 duration-500`}>
                {React.cloneElement(card.icon, { size: 28 })}
              </div>
              <div>
                <h3 className="font-black text-slate-900 mb-2 uppercase text-xs tracking-widest">{card.title}</h3>
                <p className="text-slate-400 text-xs font-bold">{card.desc}</p>
              </div>
            </Motion.div>
          </Link>
        ))}
      </Motion.div>
    </section>
  );
};

export default FeatureStrip;
