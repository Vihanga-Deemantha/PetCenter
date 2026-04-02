import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { Rocket, ArrowLeft, Bell } from "lucide-react";

const pageLabels = {
  "/ecosystems": { title: "Ecosystems", desc: "Design breathtaking custom habitats for your exotic companions. Aquariums, terrariums, paludariums — built by experts." },
  "/donations": { title: "Donations", desc: "Support animal rescue missions and shelters directly. Every donation saves a life." },
  "/about": { title: "About Us", desc: "Learn about the team behind PetCenter and our mission to build a better world for every pet." },
};

const ComingSoon = () => {
  const { pathname } = useLocation();
  const page = pageLabels[pathname] || { title: "Coming Soon", desc: "This feature is under active development and will be available soon." };

  return (
    <div className="flex flex-col items-center justify-center min-h-[72vh] text-center px-5">
      <Motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {/* Icon */}
        <Motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="inline-flex items-center justify-center w-28 h-28 bg-linear-to-br from-primary to-accent rounded-[32px] shadow-2xl shadow-primary/30 mb-10"
        >
          <Rocket size={48} className="text-white" />
        </Motion.div>

        <span className="inline-block mb-6 px-5 py-2 bg-amber-50 text-amber-600 rounded-full text-xs font-black uppercase tracking-widest border border-amber-100">
          Phase 2 — Coming Soon
        </span>

        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-6 leading-tight">
          {page.title}
        </h1>
        <p className="text-xl text-slate-500 font-medium max-w-lg mx-auto mb-12 leading-relaxed">
          {page.desc}
        </p>

        {/* Notify placeholder */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link to="/marketplace" className="btn btn-primary px-10 py-4 text-lg">
            <ArrowLeft size={20} />
            Back to Marketplace
          </Link>
          <Link to="/" className="btn bg-white border border-slate-200 text-slate-700 px-10 py-4 text-lg hover:bg-slate-50 transition-all">
            <Bell size={20} />
            Go to Home
          </Link>
        </div>

        {/* Progress bar teaser */}
        <div className="bg-slate-100 rounded-full h-2 w-64 mx-auto overflow-hidden">
          <Motion.div
            initial={{ width: 0 }}
            animate={{ width: "65%" }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
            className="h-full bg-linear-to-r from-primary to-accent rounded-full"
          />
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-3">65% development complete</p>
      </Motion.div>
    </div>
  );
};

export default ComingSoon;
