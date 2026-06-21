import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion as Motion, useReducedMotion } from "framer-motion";
import { PawPrint, Star, ArrowRight, Plus } from "lucide-react";
import heroPoster from "../../assets/stunning_pet_ecosystem_hero.png";
import { getPublicStats } from "../../api/admin.api";

const HeroSection = () => {
  const shouldReduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    getPublicStats()
      .then((res) => setStats(res.data.data))
      .catch(() => {}); // fail silently — fallback values used below
  }, []);

  // Video plays on desktop only if prefers-reduced-motion is off
  const playVideo = !isMobile && !shouldReduceMotion;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 25 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 90, damping: 20 }
    }
  };

  return (
    <section className="relative min-h-[70vh] md:min-h-screen flex items-center justify-center pt-24 pb-16 overflow-hidden bg-slate-950 text-white">
      {/* Background Video/Image Container */}
      <div className="absolute inset-0 w-full h-full z-0">
        {playVideo ? (
          <video
            src="/video/hero_loop.mp4"
            poster={heroPoster}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img 
            src={heroPoster} 
            alt="Pet Ecosystem Hero" 
            className="w-full h-full object-cover opacity-90"
          />
        )}
        {/* Dark overlay for optimal text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-slate-950/95 z-1" />
      </div>

      {/* Centered Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-[5%] text-center flex flex-col items-center">
        <Motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center gap-8"
        >
          {/* Subtitle Badge */}
          <Motion.div variants={item}>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 border border-white/10 rounded-full text-xs font-black uppercase tracking-widest text-teal-300 shadow-lg backdrop-blur-md">
              <PawPrint size={14} className="animate-pulse" /> The Future of Pet Care
            </span>
          </Motion.div>

          {/* Main Headline */}
          <Motion.h1 
            variants={item} 
            className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.1] tracking-tighter max-w-4xl"
          >
            Build a <span className="inline-block px-2 bg-linear-to-r from-indigo-300 to-teal-300 bg-clip-text text-transparent italic overflow-visible">better world</span> for every pet.
          </Motion.h1>

          {/* Description */}
          <Motion.p 
            variants={item} 
            className="text-lg md:text-xl text-slate-200/90 max-w-2xl leading-relaxed font-secondary font-medium"
          >
            The platform that brings together buying pets, finding premium supplies, supporting rescue missions, 
            and designing breathtaking custom ecosystems for your unique pet companions.
          </Motion.p>

          {/* CTA Buttons */}
          <Motion.div 
            variants={item} 
            className="flex flex-col sm:flex-row gap-6 mt-4 w-full sm:w-auto"
          >
            <Link 
              to="/marketplace" 
              className="btn btn-primary px-10 py-5 text-lg rounded-2xl shadow-2xl flex items-center justify-center gap-3 group"
            >
              Browse Pets <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link 
              to="/create-listing" 
              className="btn bg-white/10 border border-white/20 text-white px-10 py-5 text-lg rounded-2xl hover:bg-white/20 hover:border-white/35 transition-all flex items-center justify-center gap-3 backdrop-blur-xs"
            >
              List Your Pet <Plus size={20} />
            </Link>
          </Motion.div>

          {/* Trust Badges */}
          <Motion.div
            variants={item}
            className="flex flex-col sm:flex-row items-center gap-6 pt-10 border-t border-white/10 mt-6 w-full justify-center"
          >
            {/* Avatar Group */}
            <div className="flex -space-x-3">
              {stats?.recentAvatars ? (
                stats.recentAvatars.map((avatar, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 overflow-hidden flex items-center justify-center text-white text-[10px] font-bold"
                  >
                    {avatar ? (
                      <img src={avatar} alt="user" className="w-full h-full object-cover" />
                    ) : (
                      <span>U</span>
                    )}
                  </div>
                ))
              ) : (
                [1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 overflow-hidden"
                  >
                    {/* Placeholder while loading */}
                  </div>
                ))
              )}
              <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                {stats?.totalUsers
                  ? stats.totalUsers >= 1000
                    ? `${(stats.totalUsers / 1000).toFixed(0)}k+`
                    : `${stats.totalUsers}+`
                  : "50k+"}
              </div>
            </div>
            {/* Rating text */}
            <div className="flex flex-col items-center sm:items-start">
              <div className="flex items-center gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={14} fill="currentColor" />
                ))}
                <span className="text-white font-black ml-1">
                  {stats?.averageRating ? `${stats.averageRating}/5` : "5/5"}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                {stats?.reviewCount
                  ? `${stats.reviewCount} Verified Reviews`
                  : "Trusted Sellers & Caretakers"}
              </p>
            </div>
          </Motion.div>
        </Motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
