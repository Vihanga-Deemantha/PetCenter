import React, { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { Heart, CheckCircle2, ChevronRight, Home, ArrowRight, Share2 } from "lucide-react";
import confetti from "canvas-confetti";

const ThankYou = () => {
  const [searchParams] = useSearchParams();
  const paymentIntentId = searchParams.get("paymentIntent");

  useEffect(() => {
    // Fire confetti immediately on entry
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#6366f1", "#f43f5e", "#8b5cf6"]
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#6366f1", "#f43f5e", "#8b5cf6"]
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12">
      <Motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 20 }}
        className="glass-card max-w-xl w-full p-8 md:p-12 text-center bg-white/95 border-slate-100 shadow-xl"
      >
        {/* Animated Heart Check Circle */}
        <div className="relative mx-auto w-24 h-24 mb-8">
          <Motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="w-full h-full rounded-full bg-rose-50 flex items-center justify-center text-rose-500"
          >
            <Heart size={44} className="fill-current text-rose-500 animate-pulse" />
          </Motion.div>
          <Motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.3 }}
            className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1.5 border-4 border-white"
          >
            <CheckCircle2 size={18} />
          </Motion.div>
        </div>

        <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-3">
          Thank <span className="bg-linear-to-r from-secondary to-accent bg-clip-text text-transparent">You!</span>
        </h1>
        <p className="text-slate-500 font-semibold text-lg mb-6">
          Your donation has been completed successfully. Your generosity helps provide shelters with life-saving resources, medical supplies, and warmth.
        </p>

        {paymentIntentId && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 inline-block font-mono text-xs text-slate-400 font-bold mb-8 select-all">
            Stripe Ref: {paymentIntentId}
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            to="/campaigns"
            className="btn btn-primary bg-linear-to-br from-secondary to-accent shadow-rose-500/20 py-3.5 px-6 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 w-full sm:w-auto"
          >
            Browse Other Causes <ArrowRight size={13} />
          </Link>
          <Link 
            to="/"
            className="btn py-3.5 px-6 rounded-xl text-xs font-black uppercase tracking-widest bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all border border-slate-200 flex items-center justify-center gap-1.5 w-full sm:w-auto"
          >
            <Home size={14} /> Back to Home
          </Link>
        </div>
      </Motion.div>
    </div>
  );
};

export default ThankYou;
