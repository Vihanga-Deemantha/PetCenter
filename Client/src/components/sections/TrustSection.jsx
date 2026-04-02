import React from "react";
import { motion as Motion } from "framer-motion";
import { Star, Shield, MessageSquare } from "lucide-react";

const TrustSection = () => {
  const testimonials = [
    { 
      name: "Alex Johnson", 
      role: "Bearded Dragon Owner", 
      text: "The Ecosystem Builder is pure magic. I designed my dragon's perfect habitat in minutes and it arrived exactly as I envisioned.", 
      rating: 5 
    },
    { 
      name: "Sarah Miller", 
      role: "Registered Breeder", 
      text: "PetCenter's verification process is the best in the industry. It gives my buyers real confidence and keeps the pets safe.", 
      rating: 5 
    },
    { 
      name: "Michael Chen", 
      role: "Aquarium Enthusiast", 
      text: "Finally, a platform that understands high-end terrariums and aquariums. Premium service, every single time.", 
      rating: 5 
    }
  ];

  return (
    <section className="py-32 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-[5%]">
        <div className="flex flex-col lg:flex-row gap-20 items-center">
          {/* Trust Stats Side */}
          <div className="lg:w-1/3 flex flex-col gap-10">
            <div>
              <span className="text-primary font-black uppercase tracking-widest text-xs mb-4 block">Proven Excellence</span>
              <h2 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tighter mb-8 leading-tight">
                Trusted by pet lovers and experts.
              </h2>
            </div>

            <div className="flex flex-col gap-8">
              {[
                { label: "Verified Sellers", value: "850+", icon: <Shield size={24} className="text-emerald-500" /> },
                { label: "Satisfaction Rate", value: "99.9%", icon: <Star size={24} fill="currentColor" className="text-amber-500" /> }
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-6 p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    {stat.icon}
                  </div>
                  <div>
                    <h4 className="text-3xl font-black text-slate-950">{stat.value}</h4>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonials Side */}
          <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((test, i) => (
              <Motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`glass-card p-12 bg-white border-slate-100 shadow-sm flex flex-col gap-8 relative ${i === 2 ? 'md:col-span-2' : ''}`}
              >
                <MessageSquare className="text-primary/10 absolute top-8 right-8" size={64} />
                <div className="flex gap-1 text-amber-400">
                  {[...Array(test.rating)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                </div>
                <p className="text-lg text-slate-600 font-medium leading-relaxed italic relative z-10">"{test.text}"</p>
                <div className="flex items-center gap-4 mt-auto">
                  <div className="w-12 h-12 bg-slate-100 rounded-full overflow-hidden">
                    <img src={`https://i.pravatar.cc/150?u=${test.name}`} alt={test.name} />
                  </div>
                  <div>
                    <h5 className="font-black text-slate-900">{test.name}</h5>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">{test.role}</p>
                  </div>
                </div>
              </Motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
