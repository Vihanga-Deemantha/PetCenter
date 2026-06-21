import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { Heart, Users, Globe, ArrowRight } from "lucide-react";
import impactImage from "../../assets/donation_impact_pets_1775087943712.png";
import { getPublicStats } from "../../api/admin.api";

const DonationImpactSection = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getPublicStats()
      .then((res) => setStats(res.data.data))
      .catch(() => {});
  }, []);

  const formatStat = (num) => {
    if (num === undefined || num === null) return "-";
    if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}k+`;
    return `${num}+`;
  };

  const impactStats = [
    { label: "Rescued Pets", value: formatStat(stats?.rescuedPets), icon: <Heart className="text-rose-500" /> },
    { label: "Global Partners", value: formatStat(stats?.globalPartners), icon: <Globe className="text-emerald-500" /> },
    { label: "Happy Families", value: formatStat(stats?.happyFamilies), icon: <Users className="text-amber-500" /> }
  ];

  return (
    <section className="py-40 bg-[#fdfcf9] relative overflow-hidden">
      {/* Soft Blobs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-100/30 rounded-full blur-[140px] translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-100/20 rounded-full blur-[120px] -translate-x-1/4 translate-y-1/4" />
      
      <div className="max-w-7xl mx-auto px-[5%] grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
        {/* Left Side: Emotional Story */}
        <Motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative group"
        >
          <div className="relative z-10 rounded-[48px] overflow-hidden shadow-2xl shadow-amber-900/5 aspect-square lg:aspect-4/5">
            <img 
              src={impactImage} 
              alt="Emotional Rescue Impact" 
              className="w-full h-full object-cover grayscale-20 group-hover:grayscale-0 transition-all duration-1000" 
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent pointer-events-none" />
          </div>

          {/* Floating Fact Card */}
          <Motion.div 
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-8 -right-8 z-20 glass-card p-10 bg-white shadow-2xl border border-slate-50 flex flex-col gap-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shadow-inner">
                <Heart size={28} fill="currentColor" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Impact Made</p>
                <p className="text-2xl font-black text-slate-900 leading-tight">10% Donated</p>
              </div>
            </div>
            <p className="text-slate-500 font-bold text-sm max-w-[200px]">Of every transaction helps our local rescue partners.</p>
          </Motion.div>
        </Motion.div>

        {/* Right Side: Text & Counter Stats */}
        <div className="text-center lg:text-left flex flex-col gap-10">
          <div>
            <span className="text-rose-500 font-black uppercase tracking-widest text-xs mb-4 block">Our Shared Mission</span>
            <h2 className="text-5xl md:text-6xl font-black text-slate-950 tracking-tighter mb-8 leading-tight">
              Support animals that <br className="hidden lg:block"/> need help most.
            </h2>
            <p className="text-xl text-slate-500 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              We believe every pet deserves a second chance. Through your purchases and direct 
              campaigns, we've helped thousands of animals find safe, loving environments.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {impactStats.map((stat, i) => (
              <Motion.div 
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center lg:items-start gap-3"
              >
                <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-50 mb-2">
                  {stat.icon}
                </div>
                <h4 className="text-4xl font-black text-slate-950 tracking-tighter">{stat.value}</h4>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              </Motion.div>
            ))}
          </div>

          <Link to="/campaigns" className="btn bg-white border border-slate-100 text-slate-900 px-10 py-5 text-lg rounded-2xl shadow-xl shadow-amber-900/5 hover:bg-slate-50 transition-all flex items-center gap-3 w-fit mx-auto lg:mx-0 font-black">
            View Active Campaigns <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default DonationImpactSection;
