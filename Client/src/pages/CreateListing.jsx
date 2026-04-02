import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createListing } from "../api/listing.api";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Plus, MapPin, Wallet, Info, CheckCircle, ShieldCheck, ImagePlus, X, Clock, ChevronRight, ChevronLeft, Flag } from "lucide-react";

const CreateListing = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    petType: "dog",
    breed: "",
    age: "",
    gender: "male",
    price: "0",
    location: "",
    description: "",
    healthInfo: "",
    listingType: "sale",
    contactDetails: "",
  });
  
  const [images, setImages] = useState([]); // File objects
  const [previews, setPreviews] = useState([]); // Preview URLs
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  // Load from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem("listingDraft");
    if (savedDraft) {
      try {
        setFormData(JSON.parse(savedDraft));
      } catch {
        // ignore invalid JSON
      }
    }
  }, []);

  // Save to localStorage when formData changes
  useEffect(() => {
    localStorage.setItem("listingDraft", JSON.stringify(formData));
  }, [formData]);

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onImageChange = (e) => {
    const files = Array.from(e.target.files);
    const total = images.length + files.length;
    if (total > 5) {
      setError("Maximum 5 images allowed");
      return;
    }
    const newFiles = [...images, ...files];
    setImages(newFiles);
    setPreviews(newFiles.map((f) => URL.createObjectURL(f)));
    setError("");
  };

  const removeImage = (i) => {
    const newFiles = images.filter((_, idx) => idx !== i);
    const newPreviews = previews.filter((_, idx) => idx !== i);
    setImages(newFiles);
    setPreviews(newPreviews);
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.title || !formData.breed || !formData.age) return "Please fill out all required fields.";
    }
    if (step === 2) {
      if (!formData.location || !formData.contactDetails) return "Please provide location and contact details.";
      if (formData.listingType === "sale" && (!formData.price || formData.price === "0")) return "Please set a price for the sale.";
    }
    if (step === 3) {
      if (!formData.healthInfo || !formData.description) return "Please complete the health and description sections.";
    }
    return "";
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setStep(s => Math.min(s + 1, 4));
  };

  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) {
      setError("Please upload at least 1 photo of your pet.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
      images.forEach((img) => fd.append("images", img));

      await createListing(fd);
      localStorage.removeItem("listingDraft"); // Clear draft on success
      setSuccess(true);
      setTimeout(() => navigate("/my-listings"), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create listing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-40">
        <Motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="bg-amber-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 text-amber-500 shadow-xl shadow-amber-500/10">
            <Clock size={48} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">Listing Submitted!</h1>
          <p className="text-slate-500 text-lg font-medium max-w-md mx-auto">
            Your listing is <span className="text-amber-600 font-black">pending review</span>. An admin will approve it shortly and it will appear in the marketplace.
          </p>
        </Motion.div>
      </div>
    );
  }

  const stepLabels = ["Basic Info", "Details & Pricing", "Health & Story", "Photos"];

  return (
    <div className="max-w-4xl mx-auto pb-24 px-5">
      <div className="mb-12 py-8 border-b border-slate-200">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2 text-slate-900">Post a New Listing</h1>
        <p className="text-slate-500 text-lg font-medium flex items-center gap-2">
          <Clock size={16} className="text-amber-500" />
          Draft saved locally. New listings require admin approval.
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-10 flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full z-0" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-500" style={{ width: `${((step - 1) / 3) * 100}%` }} />
        
        {stepLabels.map((label, i) => (
          <div key={i} className="relative z-10 flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-colors duration-500 ${step > i ? "bg-primary text-white shadow-lg shadow-primary/20" : step === i + 1 ? "bg-white border-2 border-primary text-primary" : "bg-white border-2 border-slate-200 text-slate-400"}`}>
              {step > i + 1 ? <CheckCircle size={16} /> : i + 1}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest absolute -bottom-6 w-24 text-center ${step === i + 1 ? "text-primary" : "text-slate-400"}`}>
              {label}
            </span>
          </div>
        ))}
      </div>

      <Motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="glass-card p-8 md:p-12 bg-white shadow-2xl shadow-indigo-500/10 border-slate-100"
      >
        {error && (
          <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-4 bg-rose-50 text-rose-600 rounded-xl mb-8 border border-rose-100 text-sm font-bold">
            <Info size={18} /> {error}
          </Motion.div>
        )}

        <form className="space-y-10" onSubmit={(e) => e.preventDefault()}>
          
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Listing Title *</label>
                <input type="text" name="title" placeholder="e.g. Friendly Golden Retriever Puppy" value={formData.title} onChange={onChange} className="w-full px-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold placeholder:text-slate-300" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Species</label>
                  <select name="petType" value={formData.petType} onChange={onChange} className="w-full px-5 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none appearance-none font-semibold text-slate-700">
                    <option value="dog">🐶 Dog</option>
                    <option value="cat">🐱 Cat</option>
                    <option value="bird">🐦 Bird</option>
                    <option value="fish">🐟 Fish</option>
                    <option value="reptile">🦎 Reptile</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Breed *</label>
                  <input type="text" name="breed" value={formData.breed} onChange={onChange} placeholder="e.g. Labrador" className="w-full px-5 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none font-semibold placeholder:text-slate-300" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Age (Months) *</label>
                  <input type="number" name="age" value={formData.age} onChange={onChange} min="0" placeholder="e.g. 12" className="w-full px-5 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none font-semibold" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Gender</label>
                  <select name="gender" value={formData.gender} onChange={onChange} className="w-full px-5 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none appearance-none font-semibold text-slate-700">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Details & Pricing */}
          {step === 2 && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Listing Purpose</label>
                  <select name="listingType" value={formData.listingType} onChange={onChange} className="w-full px-5 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none appearance-none font-semibold text-slate-700">
                    <option value="sale">For Sale</option>
                    <option value="adoption">For Adoption (Free)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Location *</label>
                  <div className="relative">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={20} />
                    <input type="text" name="location" value={formData.location} onChange={onChange} placeholder="City, Country" className="w-full pl-14 pr-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none font-semibold placeholder:text-slate-300" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Price (LKR) *</label>
                  <div className="relative">
                    <Wallet className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={20} />
                    <input type="number" name="price" value={formData.price} onChange={onChange} disabled={formData.listingType === "adoption"} min="0" className="w-full pl-14 pr-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none font-black text-xl text-primary disabled:opacity-50" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Contact Details *</label>
                  <input type="text" name="contactDetails" value={formData.contactDetails} onChange={onChange} placeholder="Phone or email for inquiries" className="w-full px-5 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none font-semibold placeholder:text-slate-300" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Health & Story */}
          {step === 3 && (
            <div className="space-y-8">
              <div>
                <label className="flex text-xs font-black uppercase tracking-widest text-slate-400 mb-3 items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-500" /> Health & Vaccination Info *
                </label>
                <textarea name="healthInfo" value={formData.healthInfo} onChange={onChange} placeholder="e.g. Vaccinated, dewormed, vet check done..." className="w-full px-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none h-28 font-semibold resize-none placeholder:text-slate-300" />
              </div>
              <div>
                <label className="flex text-xs font-black uppercase tracking-widest text-slate-400 mb-3 items-center gap-2">
                  <Info size={16} className="text-primary" /> Detailed Description *
                </label>
                <textarea name="description" value={formData.description} onChange={onChange} placeholder="Tell potential owners about the personality, habits, and story of your pet..." className="w-full px-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none h-40 font-semibold resize-none placeholder:text-slate-300" />
              </div>
            </div>
          )}

          {/* STEP 4: Photos */}
          {step === 4 && (
            <div>
              <label className="flex text-xs font-black uppercase tracking-widest text-slate-400 mb-3 items-center gap-2">
                <ImagePlus size={16} className="text-primary" /> Pet Photos (1-5 Required)
              </label>
              <label className="flex flex-col items-center justify-center h-48 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 cursor-pointer hover:border-primary/40 hover:bg-indigo-50/30 transition-all">
                <ImagePlus size={36} className="text-slate-400 mb-3" />
                <span className="text-sm font-bold text-slate-500">Click to Select Photos</span>
                <span className="text-xs text-slate-400 mt-2">JPG, PNG or WebP — Max 5MB Limit per image</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={onImageChange} />
              </label>

              {previews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6">
                  {previews.map((src, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden h-28 shadow-sm">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute inset-0 bg-rose-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={24} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Wizard Controls */}
          <div className="pt-8 border-t border-slate-100 flex gap-4">
            {step > 1 && (
              <button type="button" onClick={handlePrev} className="btn bg-slate-100 text-slate-600 hover:bg-slate-200 py-4 px-6 flex items-center gap-2">
                <ChevronLeft size={20} /> Back
              </button>
            )}
            
            {step < 4 ? (
              <button type="button" onClick={handleNext} className="btn btn-primary py-4 px-8 flex items-center gap-2 ml-auto">
                Next Step <ChevronRight size={20} />
              </button>
            ) : (
              <button type="button" onClick={onSubmit} disabled={loading} className="btn btn-primary w-full py-5 text-xl group ml-auto shadow-xl shadow-primary/30 hover:shadow-primary/40">
                {loading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-4 border-white border-t-transparent mx-auto" />
                ) : (
                  <span className="flex items-center justify-center gap-2"><Flag size={20} /> Finish & Submit Listing</span>
                )}
              </button>
            )}
          </div>

        </form>
      </Motion.div>
    </div>
  );
};

export default CreateListing;
