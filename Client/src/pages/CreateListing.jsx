import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPet } from "../services/petService";
import { motion as Motion } from "framer-motion";
import { Plus, Tag, MapPin, DollarSign, Info, Upload, CheckCircle, ShieldCheck } from "lucide-react";

const CreateListing = () => {
  const [formData, setFormData] = useState({
    title: "",
    petType: "dog",
    breed: "",
    age: "",
    gender: "male",
    price: "",
    location: "",
    description: "",
    healthInfo: "",
    listingType: "sale",
    contactDetails: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createPet(formData);
      setSuccess(true);
      setTimeout(() => navigate("/marketplace"), 2000);
    } catch (error) {
      console.error("Failed to create pet listing", error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-40">
        <Motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-500 shadow-xl shadow-emerald-500/10">
            <CheckCircle size={48} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">Listing Created!</h1>
          <p className="text-slate-500 text-lg font-medium">Your pet ad has been posted successfully. Redirecting...</p>
        </Motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 px-5">
      <div className="mb-12 py-8 border-b border-slate-200">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2 text-slate-900">Post a New Listing</h1>
        <p className="text-slate-500 text-lg font-medium">Share your pet with our premium community of verified owners.</p>
      </div>
      
      <Motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 md:p-12 bg-white shadow-2xl shadow-indigo-500/10 border-slate-100"
      >
        <form onSubmit={onSubmit} className="space-y-10">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Listing Title</label>
            <input 
              type="text" 
              name="title" 
              placeholder="e.g. Friendly Golden Retriever for Adoption" 
              value={formData.title} 
              onChange={onChange} 
              required 
              className="w-full px-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold placeholder:text-slate-300"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3 text-nowrap">Pet Species</label>
              <select name="petType" value={formData.petType} onChange={onChange} className="w-full px-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer font-semibold text-slate-700">
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
                <option value="bird">Bird</option>
                <option value="fish">Fish</option>
                <option value="reptile">Reptile</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Breed</label>
              <input type="text" name="breed" value={formData.breed} onChange={onChange} required className="w-full px-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none font-semibold transition-all" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Age (Years)</label>
              <input type="number" name="age" value={formData.age} onChange={onChange} required className="w-full px-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none font-semibold transition-all" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Gender</label>
              <select name="gender" value={formData.gender} onChange={onChange} className="w-full px-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer font-semibold text-slate-700">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Price ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={20} />
                <input type="number" name="price" value={formData.price} onChange={onChange} required className="w-full pl-14 pr-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none font-black text-xl text-primary" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Location</label>
              <div className="relative">
                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={20} />
                <input type="text" name="location" value={formData.location} onChange={onChange} required className="w-full pl-14 pr-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none font-semibold transition-all" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Listing Purpose</label>
              <select name="listingType" value={formData.listingType} onChange={onChange} className="w-full px-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer font-semibold text-slate-700">
                <option value="sale">For Sale</option>
                <option value="adoption">For Adoption</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Contact Email/Phone</label>
              <input type="text" name="contactDetails" value={formData.contactDetails} onChange={onChange} required className="w-full px-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none font-semibold transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" />
              Health & Vaccination Info
            </label>
            <textarea name="healthInfo" value={formData.healthInfo} onChange={onChange} required className="w-full px-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none h-28 font-semibold resize-none transition-all" />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <Info size={16} className="text-primary" />
              Detailed Description
            </label>
            <textarea name="description" value={formData.description} onChange={onChange} required className="w-full px-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none h-40 font-semibold resize-none transition-all" />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full py-5 text-xl relative group overflow-hidden">
            <span className="relative z-10 flex items-center justify-center gap-3">
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-4 border-white border-t-transparent" />
              ) : (
                <><CheckCircle size={24} /> Create Listing</>
              )}
            </span>
          </button>
        </form>
      </Motion.div>
    </div>
  );
};

export default CreateListing;
