import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";

const Unauthorized = () => {
  return (
    <div className="text-center py-40 px-5">
      <Motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-10 inline-block p-8 bg-rose-50 rounded-full text-rose-600 shadow-xl shadow-rose-500/10 border border-rose-100"
      >
        <ShieldAlert size={64} />
      </Motion.div>
      <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">Unauthorized Access</h1>
      <p className="text-slate-500 text-lg font-medium mb-12 max-w-md mx-auto">You don't have the required permissions to view this secure galactic portal.</p>
      <Link to="/" className="btn btn-primary px-10 py-4 group">
        <span className="flex items-center gap-3">
          <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" /> Back to Safety
        </span>
      </Link>
    </div>
  );
};

export default Unauthorized;
