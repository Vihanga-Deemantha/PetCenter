import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion as Motion, useReducedMotion } from "framer-motion";
import { Stethoscope } from "lucide-react";
import heroPoster from "../../assets/hero_poster_new.jpg";
import { getPublicStats } from "../../api/admin.api";

const formatCount = (num, suffix = "+") => {
  if (num === undefined || num === null) return null;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}k${suffix}`;
  return `${num}${suffix}`;
};

const HeroSection = () => {
  const shouldReduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    getPublicStats()
      .then((res) => setStats(res.data.data))
      .catch(() => {});
  }, []);

  const playVideo = !isMobile && !shouldReduceMotion;

  const statLine = [
    { value: formatCount(stats?.rescuedPets) || "2,400+", label: "Pets rehomed" },
    { value: stats?.globalPartners ?? "68", label: "Partner shelters" },
    { value: stats?.averageRating || "4.9", label: "Avg. rating" },
  ];

  return (
    <section className="max-w-7xl mx-auto px-7 pt-18 pb-22 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      <Motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <p className="text-xs tracking-[0.18em] uppercase text-accent font-semibold mb-5.5">Pets · Supplies · Habitats</p>
        <h1 className="font-heading text-[44px] sm:text-6xl lg:text-[76px] leading-[1.04] font-medium text-[#292925] mb-6 tracking-tight text-pretty">
          Thoughtful care
          <br />
          for every <span className="italic text-accent">companion</span>
        </h1>
        <p className="text-[17px] leading-relaxed text-[#5c5c54] max-w-110 mb-8.5">
          Adopt with confidence, shop calm and considered supplies, and design a habitat your pet will thrive in. One place, one standard of care.
        </p>
        <div className="flex flex-wrap gap-3.5 mb-11">
          <Link to="/marketplace" className="btn bg-accent text-white hover:bg-secondary px-8 py-4">
            Meet the pets
          </Link>
          <Link to="/ecosystem" className="btn border border-[#cfc8ba] text-secondary hover:bg-[#E8E2D8] px-8 py-4">
            Build a habitat
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-5 border-t border-[#E8E2D8] pt-6.5 max-w-115">
          {statLine.map((s) => (
            <div key={s.label}>
              <p className="font-heading text-[28px] text-[#292925] m-0">{s.value}</p>
              <p className="mt-1 text-xs tracking-wider uppercase text-[#8a8a80]">{s.label}</p>
            </div>
          ))}
        </div>
      </Motion.div>

      <Motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="relative"
      >
        <div className="relative rounded-[28px] overflow-hidden bg-[#E8E2D8] border border-[#dcd4c6] aspect-5/4">
          {playVideo ? (
            <video src="/video/hero_loop.mp4" poster={heroPoster} autoPlay muted loop playsInline className="w-full h-full object-cover" />
          ) : (
            <img src={heroPoster} alt="A pet's habitat, thoughtfully built" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-[#292925]/28 to-transparent pointer-events-none" />
        </div>
        <div className="absolute -left-5 -top-5 bg-light text-[#292925] rounded-2xl px-4.5 py-3.5 shadow-2xl shadow-black/40 flex items-center gap-3.5">
          <span className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <Stethoscope size={20} />
          </span>
          <div>
            <p className="m-0 text-[11px] tracking-wider uppercase text-accent">Quality checked</p>
            <p className="mt-0.5 text-sm font-semibold">Vet-reviewed listings</p>
          </div>
        </div>
      </Motion.div>
    </section>
  );
};

export default HeroSection;
