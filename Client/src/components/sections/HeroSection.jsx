import React from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { PawPrint, Mail, Phone, MapPin, Globe, Activity, Star, ArrowRight, Shield, Heart, Plus } from "lucide-react";
import heroImage from "../../assets/stunning_pet_ecosystem_hero.png";

const pawTrail = [
  { id: 1, left: "8%", top: "18%", delay: 0, size: 16, rotate: -18 },
  { id: 2, left: "18%", top: "30%", delay: 0.8, size: 20, rotate: -8 },
  { id: 3, left: "30%", top: "22%", delay: 1.4, size: 15, rotate: 10 },
  { id: 4, left: "64%", top: "16%", delay: 2.1, size: 21, rotate: -12 },
  { id: 5, left: "76%", top: "28%", delay: 2.8, size: 17, rotate: 12 },
  { id: 6, left: "88%", top: "20%", delay: 3.4, size: 15, rotate: -6 },
];

const HeroSection = () => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 20 }
    }
  };

  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden bg-white">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 w-125 h-125 bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-100 h-100 bg-accent/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />

      {/* Home-only paw animation */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {pawTrail.map((paw) => (
          <Motion.span
            key={paw.id}
            className="absolute text-primary/30 drop-shadow-sm"
            style={{ left: paw.left, top: paw.top, fontSize: `${paw.size}px`, rotate: `${paw.rotate}deg` }}
            initial={{ opacity: 0, scale: 0.4, y: 12 }}
            animate={{ opacity: [0, 0.9, 0.3], scale: [0.4, 1, 0.92], y: [12, 0, -8] }}
            transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 0.4, delay: paw.delay, ease: "easeInOut" }}
          >
            🐾
          </Motion.span>
        ))}
      </div>
      
      <div className="max-w-7xl mx-auto px-[5%] grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
        {/* Left Content */}
        <Motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-8"
        >
          <Motion.div variants={item}>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-xs font-black uppercase tracking-widest text-primary shadow-sm">
              <PawPrint size={14} /> The Future of Pet Care
            </span>
          </Motion.div>

          <Motion.h1 variants={item} className="text-6xl md:text-7xl lg:text-8xl font-black text-slate-950 leading-[1.05] tracking-tighter">
            Build a <span className="text-primary italic">better world</span> for every pet.
          </Motion.h1>

          <Motion.p variants={item} className="text-xl text-slate-500 max-w-xl leading-relaxed font-secondary font-medium">
            The platform that brings together buying pets, finding premium supplies, support rescue missions, 
            and designing breathtaking custom ecosystems for your unique pet companions.
          </Motion.p>

          <Motion.div variants={item} className="flex flex-col sm:flex-row gap-6 mt-4">
            <Link to="/marketplace" className="btn btn-primary px-10 py-5 text-lg rounded-2xl shadow-2xl shadow-primary/30 flex items-center gap-3 group">
              Explore Pets <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/ecosystems" className="btn bg-white border border-slate-200 text-slate-800 px-10 py-5 text-lg rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-3">
              Ecosystems <Plus size={20} />
            </Link>
          </Motion.div>

          {/* Trust Badges */}
          <Motion.div variants={item} className="flex items-center gap-8 pt-8 border-t border-slate-50 mt-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 overflow-hidden">
                  <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" />
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-white bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                50k+
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-amber-500">
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <span className="text-slate-900 font-black ml-1">4.9/5</span>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trusted Sellers & Caretakers</p>
            </div>
          </Motion.div>
        </Motion.div>

        {/* Right Visual */}
        <Motion.div 
          initial={{ opacity: 0, scale: 0.8, x: 50 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
          className="relative flex flex-col md:flex-row lg:flex-col gap-8 items-center"
        >
          {/* Main Visual Frame */}
          <div className="relative z-10 w-full rounded-[40px] overflow-hidden shadow-2xl shadow-slate-200/50 group">
             <div className="absolute inset-0 bg-linear-to-tr from-primary/20 to-transparent mix-blend-overlay pointer-events-none" />
             <Motion.img 
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              src={heroImage} 
              alt="Build a better world" 
              className="w-full h-auto block"
             />
          </div>

          {/* Floating Glass Cards */}
          <Motion.div 
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-10 -left-10 z-20 glass-card p-6 bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl shadow-indigo-500/10 hidden md:block"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center">
                <Shield size={24} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Safe & Verified</p>
                <p className="font-black text-slate-900 leading-tight">Trusted Global Sellers</p>
              </div>
            </div>
          </Motion.div>

          <Motion.div 
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-16 right-4 z-20 glass-card p-6 bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl shadow-teal-500/10 hidden md:block"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center">
                <Heart size={24} className="text-rose-500" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Impact Made</p>
                <p className="font-black text-slate-900 leading-tight">$1.2M Helped Rescue</p>
              </div>
            </div>
          </Motion.div>
        </Motion.div>
      </div>

    </section>
  );
};

export default HeroSection;
