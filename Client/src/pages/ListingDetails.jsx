import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getPet } from "../services/petService";
import { motion as Motion } from "framer-motion";
import { MapPin, Tag, Calendar, User, Phone, Mail, ArrowLeft, Heart, Info, ShieldCheck } from "lucide-react";

const ListingDetails = () => {
  const { id } = useParams();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPet = async () => {
      try {
        const data = await getPet(id);
        setPet(data.data);
      } catch (error) {
        console.error("Failed to fetch pet details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPet();
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', padding: '10rem' }}>Loading pet details...</div>;
  if (!pet) return <div style={{ textAlign: 'center', padding: '10rem' }}>Pet not found.</div>;

  return (
    <div className="listing-details pb-24">
      <Link to="/marketplace" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold mb-10 group">
        <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" /> Back to Marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Main Content */}
        <Motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-8"
        >
          <div className="glass-card p-3 rounded-[32px] mb-12">
            <img 
              src={pet.images[0] || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1000"} 
              alt={pet.title} 
              className="w-full h-[600px] object-cover rounded-[24px] shadow-lg"
            />
          </div>

          <div className="px-2">
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter mb-6 leading-tight">{pet.title}</h1>
            
            <div className="flex flex-wrap gap-3 mb-12">
              <span className="bg-indigo-50 text-indigo-700 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest border border-indigo-100">{pet.petType}</span>
              <span className="bg-indigo-50 text-indigo-700 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest border border-indigo-100">{pet.breed}</span>
              <span className="bg-indigo-50 text-indigo-700 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest border border-indigo-100">{pet.age} Years Old</span>
            </div>

            <div className="glass-card p-10 bg-white border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
              <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <Info size={24} className="text-primary" />
                About {pet.title}
              </h3>
              <p className="text-slate-600 text-lg leading-relaxed mb-10 whitespace-pre-wrap">{pet.description}</p>
              
              <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <ShieldCheck size={24} className="text-emerald-500" />
                Health & Wellness
              </h3>
              <p className="text-slate-600 text-lg leading-relaxed">{pet.healthInfo}</p>
            </div>
          </div>
        </Motion.div>

        {/* Sidebar */}
        <Motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-4 sticky top-28"
        >
          <div className="glass-card p-10 bg-white shadow-2xl shadow-indigo-500/10 border-slate-100">
            <div className="flex justify-between items-center mb-10 pb-8 border-b border-slate-100">
              <span className="text-5xl font-black text-primary tracking-tighter">${pet.price}</span>
              <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${pet.listingType === 'sale' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                For {pet.listingType}
              </span>
            </div>

            <div className="space-y-8 mb-10">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                  <User size={16} /> Seller Information
                </h4>
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-lg font-black text-slate-900 mb-1">{pet.owner?.name}</p>
                  <p className="flex items-center gap-1.5 text-slate-500 font-bold text-sm">
                    <MapPin size={14} className="text-primary" /> {pet.owner?.location || pet.location}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                  <Phone size={16} /> Contact Details
                </h4>
                <p className="text-xl font-black text-slate-700">{pet.contactDetails}</p>
              </div>
            </div>

            <button className="btn btn-primary w-full py-5 text-lg group">
              <Heart size={22} className="group-hover:fill-white transition-all" /> 
              Send Inquiry
            </button>

            <p className="text-center text-[10px] text-slate-400 font-bold mt-6 uppercase tracking-widest">
              Always verify sellers before payment
            </p>
          </div>
        </Motion.div>
      </div>
    </div>
  );
};

export default ListingDetails;
