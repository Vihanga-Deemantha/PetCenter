import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  useEffect(() => {
    document.title = "Page Not Found | PetCenter";
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6 py-12">
      <Motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="mb-8 relative"
      >
        {/* Animated Background Glow */}
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl w-72 h-72 mx-auto -z-10" />

        {/* Adorable illustration using emojis or styled icons */}
        <div className="text-[120px] md:text-[150px] select-none leading-none mb-4">
          🕵️‍♂️🐶
        </div>
      </Motion.div>

      <Motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="max-w-md"
      >
        <h1 className="text-8xl font-black text-slate-200 tracking-tighter leading-none mb-4">404</h1>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Lost in the Dog Park?</h2>
        <p className="text-slate-500 font-medium mb-8 leading-relaxed">
          The page you are looking for has wandered off. Let's get you back to the pack!
        </p>

        <Link
          to="/"
          className="btn btn-primary px-8 py-4 rounded-xl shadow-lg shadow-primary/20 inline-flex items-center gap-2 group hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
          Back to Home Page
        </Link>
      </Motion.div>
    </div>
  );
}
