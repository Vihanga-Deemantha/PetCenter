import React from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ArrowRight, Star, Plus } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-40 bg-white relative">
      <div className="max-w-6xl mx-auto px-[5%] text-center relative z-10">
        <Motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="glass-card bg-slate-900 p-24 md:p-32 rounded-[60px] text-white relative overflow-hidden flex flex-col items-center gap-10"
        >
          {/* Background Gradient Accents */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[140px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[120px] -translate-x-1/3 translate-y-1/3 pointer-events-none" />
          
          <Motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-primary shadow-lg"
          >
            <Star size={14} /> Design Your Pet's Life
          </Motion.div>

          <h2 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tighter max-w-4xl">
            Create a world your <br/> pet will <span className="text-primary italic">love</span> forever.
          </h2>
          
          <p className="text-xl text-slate-400 max-w-2xl font-medium leading-relaxed">
            Join the most premium community of pet lovers, builders, and caretakers. 
            Start listing your pets or building your ecosystem today.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 mt-6">
            <Link to="/register" className="btn btn-primary px-12 py-5 text-xl rounded-2xl shadow-2xl shadow-primary/30 flex items-center gap-4 group">
              Get Started Now <ArrowRight size={24} className="transition-all group-hover:translate-x-1" />
            </Link>
            <Link to="/ecosystem" className="btn bg-white/10 text-white border border-white/10 px-12 py-5 text-xl rounded-2xl hover:bg-white/20 transition-all flex items-center gap-4 font-black">
              <Plus size={24} /> Build a Habitat
            </Link>
          </div>
        </Motion.div>
      </div>
    </section>
  );
};

export default CTASection;
