import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ShieldOff, ArrowLeft, Home } from "lucide-react";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[72vh] text-center px-5">
      <Motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {/* Icon */}
        <Motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="inline-flex items-center justify-center w-28 h-28 bg-rose-50 rounded-[32px] shadow-xl shadow-rose-500/10 mb-10 border border-rose-100"
        >
          <ShieldOff size={48} className="text-rose-500" />
        </Motion.div>

        <span className="inline-block mb-6 px-5 py-2 bg-rose-50 text-rose-600 rounded-full text-xs font-black uppercase tracking-widest border border-rose-100">
          403 — Access Denied
        </span>

        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-6 leading-tight">
          Unauthorized
        </h1>
        <p className="text-xl text-slate-500 font-medium max-w-lg mx-auto mb-12 leading-relaxed">
          You don't have permission to access this page. If you believe this is a mistake,
          please contact support or log in with the correct account.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="btn bg-white border border-slate-200 text-slate-700 px-10 py-4 text-lg hover:bg-slate-50 transition-all"
          >
            <ArrowLeft size={20} /> Go Back
          </button>
          <Link to="/" className="btn btn-primary px-10 py-4 text-lg">
            <Home size={20} /> Return Home
          </Link>
        </div>
      </Motion.div>
    </div>
  );
};

export default Unauthorized;
