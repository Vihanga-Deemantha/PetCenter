import React from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { CheckCircle, ArrowRight, Star, Plus, Box } from "lucide-react";
import builderMockup from "../../assets/stunning_ecosystem_builder.png";

const EcosystemSpotlight = () => {
  return (
    <section className="py-40 bg-slate-950 text-white relative overflow-hidden">
      {/* Background visual effects */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-teal-500/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-primary/30 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-[5%] grid grid-cols-1 lg:grid-cols-2 gap-24 items-center relative z-10 text-center lg:text-left">
        {/* Left Text Content */}
        <Motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="order-2 lg:order-1"
        >
          <Motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-5 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-black uppercase tracking-widest text-teal-400 mb-8"
          >
            <Star size={14} /> Only at PetCenter
          </Motion.div>
          
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black mb-8 leading-[1.05] tracking-tighter">
            Design the <span className="text-teal-400">perfect habitat</span> for your pet.
          </h2>
          
          <p className="text-xl text-slate-400 mb-12 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
            Our unique Ecosystem Builder helps you create, customize, and buy everything you need for the perfect terrarium, 
            aquarium, or habitat in one seamless experience.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12 max-w-lg mx-auto lg:mx-0">
            {[
              { title: "Choose Pet Type", desc: "Tailored to your species" },
              { title: "Smart Essentials", desc: "Recommended by experts" },
              { title: "Full Customization", desc: "Design within your budget" },
              { title: "Seamless Buy", desc: "One-click habitat setup" }
            ].map((point, i) => (
              <div key={i} className="flex items-start gap-4 text-left">
                <Star size={20} className="text-primary" />
                <div>
                  <p className="text-xl font-black text-white leading-tight">Elite Builder</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Verified Expert</p>
                </div>
              </div>
            ))}
          </div>

          <Link to="/ecosystem" className="btn btn-primary px-12 py-5 text-xl rounded-2xl shadow-2xl shadow-primary/40 flex items-center gap-4 group mx-auto lg:mx-0 w-fit">
            <Plus size={24} /> Get Started Now <ArrowRight size={20} className="transition-all group-hover:translate-x-1" />
          </Link>

        </Motion.div>

        {/* Right Builder Visual */}
        <Motion.div 
          initial={{ opacity: 0, scale: 0.9, x: 30 }}
          whileInView={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="relative order-1 lg:order-2"
        >
          <div className="relative z-10 rounded-[50px] overflow-hidden border border-white/10 shadow-3xl shadow-teal-500/10">
            <img 
              src={builderMockup} 
              alt="Ecosystem Builder Mockup" 
              className="w-full h-auto block transform hover:scale-105 transition-transform duration-1000"
            />
          </div>

          {/* Floating interactive-looking elements */}
          <Motion.div 
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-6 -right-6 z-20 glass-card p-6 bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl hidden md:flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Box size={24} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-teal-400">Habitat Layer</p>
              <p className="font-black text-white leading-tight">Bio-active Ready</p>
            </div>
          </Motion.div>
        </Motion.div>
      </div>
    </section>
  );
};

export default EcosystemSpotlight;
