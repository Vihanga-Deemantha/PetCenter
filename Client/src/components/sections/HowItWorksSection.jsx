import React from "react";
import { motion as Motion } from "framer-motion";
import { User, Search, Plus, Heart } from "lucide-react";

const HowItWorksSection = () => {
  const steps = [
    { 
      title: "Create Account", 
      desc: "Join our community of pet lovers.",
      icon: <User size={28} /> 
    },
    { 
      title: "Find or List", 
      desc: "Browse pets or list your own arrivals.",
      icon: <Search size={28} /> 
    },
    { 
      title: "Build Habitat", 
      desc: "Use the builder to design the ecosystem.",
      icon: <Plus size={28} /> 
    },
    { 
      title: "Support Rescues", 
      desc: "Every action helps animals in need.",
      icon: <Heart size={28} fill="currentColor" /> 
    }
  ];

  return (
    <section className="py-32 bg-white relative">
      <div className="max-w-7xl mx-auto px-[5%]">
        <div className="text-center mb-24">
          <span className="text-primary font-black uppercase tracking-widest text-xs mb-4 block">Easy Process</span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-950 tracking-tighter">
            How it works.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden lg:block absolute top-[60px] left-[15%] right-[15%] h-0.5 bg-slate-50 z-0" />
          
          {steps.map((step, i) => (
            <Motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center gap-8 relative z-10 group"
            >
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-primary shadow-2xl shadow-primary/10 border border-slate-50 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                {step.icon}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-400 font-bold text-sm max-w-[200px] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </Motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
