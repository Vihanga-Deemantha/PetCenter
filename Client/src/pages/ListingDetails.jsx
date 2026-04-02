import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getListing } from "../api/listing.api";
import { motion as Motion } from "framer-motion";
import { MapPin, Tag, Calendar, User, Phone, ArrowLeft, Heart, Info, ShieldCheck, Clock, CheckCircle, XCircle } from "lucide-react";

const statusConfig = {
  active: { label: "Active", icon: <CheckCircle size={14} />, cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  pending: { label: "Pending Review", icon: <Clock size={14} />, cls: "bg-amber-50 text-amber-700 border-amber-100" },
  sold: { label: "Sold", icon: <XCircle size={14} />, cls: "bg-slate-100 text-slate-500 border-slate-200" },
  adopted: { label: "Adopted", icon: <Heart size={14} />, cls: "bg-blue-50 text-blue-700 border-blue-100" },
  removed: { label: "Removed", icon: <XCircle size={14} />, cls: "bg-rose-50 text-rose-700 border-rose-100" },
};

const ListingDetails = () => {
  const { id } = useParams();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showContact, setShowContact] = useState(false);

  const handleReveal = () => {
    if (!user) {
      return navigate("/login", { state: { from: `/marketplace/${id}` } });
    }
    setShowContact(true);
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getListing(id);
        setPet(data.data);
      } catch {
        setPet(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return (
    <div className="text-center py-40">
      <Motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="inline-block">
        <Tag size={48} className="text-primary/20" />
      </Motion.div>
    </div>
  );

  if (!pet) return (
    <div className="text-center py-40">
      <Info size={48} className="text-slate-300 mx-auto mb-4" />
      <h2 className="text-2xl font-black text-slate-700">Listing not found</h2>
      <Link to="/marketplace" className="btn btn-primary mt-6">Back to Marketplace</Link>
    </div>
  );

  const status = statusConfig[pet.status] || statusConfig.active;
  const displayImages = pet.images?.length > 0 ? pet.images : ["https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1000"];

  return (
    <div className="listing-details pb-24">
      <Link to="/marketplace" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold mb-10 group">
        <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" /> Back to Marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Main */}
        <Motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-8">
          {/* Image Gallery */}
          <div className="glass-card p-3 rounded-[32px] mb-6">
            <img
              src={displayImages[activeImg]}
              alt={pet.title}
              className="w-full h-[480px] object-cover rounded-card shadow-lg"
            />
          </div>
          {displayImages.length > 1 && (
            <div className="flex gap-3 mb-12 overflow-x-auto pb-2">
              {displayImages.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all ${i === activeImg ? "border-primary shadow-lg" : "border-transparent opacity-60 hover:opacity-100"}`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="px-2">
            {/* Status badge */}
            <div className="flex items-center gap-3 mb-4">
              <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border ${status.cls}`}>
                {status.icon} {status.label}
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter mb-6 leading-tight">{pet.title}</h1>

            <div className="flex flex-wrap gap-3 mb-12">
              <span className="bg-indigo-50 text-indigo-700 px-5 py-2 rounded-2xl font-black text-sm uppercase tracking-widest border border-indigo-100">{pet.petType}</span>
              <span className="bg-indigo-50 text-indigo-700 px-5 py-2 rounded-2xl font-black text-sm uppercase tracking-widest border border-indigo-100">{pet.breed}</span>
              <span className="bg-indigo-50 text-indigo-700 px-5 py-2 rounded-2xl font-black text-sm uppercase tracking-widest border border-indigo-100">{pet.age} months old</span>
              <span className="bg-indigo-50 text-indigo-700 px-5 py-2 rounded-2xl font-black text-sm uppercase tracking-widest border border-indigo-100">{pet.gender}</span>
            </div>

            <div className="glass-card p-10 bg-white border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-primary rounded-l-xl" />
              <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <Info size={24} className="text-primary" /> About {pet.title}
              </h3>
              <p className="text-slate-600 text-lg leading-relaxed mb-10 whitespace-pre-wrap">{pet.description}</p>

              <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <ShieldCheck size={24} className="text-emerald-500" /> Health & Wellness
              </h3>
              <p className="text-slate-600 text-lg leading-relaxed">{pet.healthInfo}</p>
            </div>
          </div>
        </Motion.div>

        {/* Sidebar */}
        <Motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-4 sticky top-28">
          <div className="glass-card p-10 bg-white shadow-2xl shadow-indigo-500/10 border-slate-100">
            {/* Price */}
            <div className="flex justify-between items-center mb-10 pb-8 border-b border-slate-100">
              <span className="text-5xl font-black text-primary tracking-tighter">
                {pet.listingType === "adoption" ? "FREE" : `LKR ${pet.price?.toLocaleString()}`}
              </span>
              <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${pet.listingType === "sale" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                For {pet.listingType}
              </span>
            </div>

            {/* Quick Details */}
            <div className="grid grid-cols-2 gap-3 mb-10">
              {[
                { icon: <Tag size={14} />, label: "Species", val: pet.petType },
                { icon: <Calendar size={14} />, label: "Age", val: `${pet.age} mo` },
                { icon: <MapPin size={14} />, label: "Location", val: pet.location },
                { icon: <Heart size={14} />, label: "Gender", val: pet.gender },
              ].map((d, i) => (
                <div key={i} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-primary mb-1">{d.icon}</div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{d.label}</p>
                  <p className="font-black text-slate-800 text-sm capitalize">{d.val}</p>
                </div>
              ))}
            </div>

            {/* Seller */}
            <div className="mb-8">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <User size={14} /> Seller
              </h4>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center text-white font-black text-xl overflow-hidden shrink-0">
                  {pet.owner?.profileImage ? (
                    <img src={pet.owner.profileImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{pet.owner?.name?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <p className="text-base font-black text-slate-900">{pet.owner?.name}</p>
                  <p className="flex items-center gap-1 text-slate-500 font-bold text-sm">
                    <MapPin size={12} className="text-primary" /> {pet.owner?.location || pet.location}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="mb-10">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                <Phone size={14} /> Contact
              </h4>
              {showContact || (user && pet.owner?._id === user._id) ? (
                <p className="text-lg font-black text-slate-700 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">{pet.contactDetails}</p>
              ) : (
                <div className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="text-lg font-black text-slate-300 tracking-widest">●●●●●●●●●</span>
                  <button 
                    onClick={handleReveal}
                    className="text-primary font-bold text-sm hover:underline"
                  >
                    Reveal
                  </button>
                </div>
              )}
            </div>

            {showContact || (user && pet.owner?._id === user._id) ? (
              <a href={`tel:${pet.contactDetails}`} className="btn btn-primary w-full py-5 text-lg group">
                <Phone size={22} /> Contact Seller
              </a>
            ) : (
              <button onClick={handleReveal} className="btn btn-primary w-full py-5 text-lg group">
                <Phone size={22} /> Show Phone Number
              </button>
            )}

            <p className="text-center text-[10px] text-slate-400 font-bold mt-6 uppercase tracking-widest">
              Always verify before making payment
            </p>
          </div>
        </Motion.div>
      </div>
    </div>
  );
};

export default ListingDetails;
