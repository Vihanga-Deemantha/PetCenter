import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getListing, updateListing, revealListingContact } from "../api/listing.api";
import { motion as Motion } from "framer-motion";
import { Save, Tag, MapPin, DollarSign, Info, Upload, CheckCircle, ArrowLeft, Plus, X, ImagePlus } from "lucide-react";
import { Link } from "react-router-dom";

const EditListing = () => {
  const { id } = useParams();
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Photo management: existing images as {url, publicId}, newly staged local
  // files as {url: blobUrl, publicId: null, file}, and removed publicIds
  const [photos, setPhotos] = useState([]);
  const [removedPublicIds, setRemovedPublicIds] = useState([]);
  const fileRef = useRef();

  const navigate = useNavigate();

  useEffect(() => {
    const fetchPet = async () => {
      try {
        const [data, contactRes] = await Promise.all([
          getListing(id),
          revealListingContact(id).catch(() => null),
        ]);
        const pet = data.data;
        // Map the API data to form data
        setFormData({
          title: pet.title || "",
          petType: pet.petType || "dog",
          breed: pet.breed || "",
          age: pet.age || "",
          gender: pet.gender || "male",
          price: pet.price || "",
          location: pet.location || "",
          description: pet.description || "",
          healthInfo: pet.healthInfo || "",
          listingType: pet.listingType || "sale",
          contactDetails: contactRes?.data?.contactDetails || "",
        });
        setPhotos(
          (pet.images || []).map((url, i) => ({
            url,
            publicId: pet.imagePublicIds?.[i] || null,
          }))
        );
      } catch (error) {
        console.error("Failed to fetch pet details", error);
        alert("Could not load pet details");
        navigate("/my-listings");
      } finally {
        setLoading(false);
      }
    };
    fetchPet();
  }, [id, navigate]);

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onPhotoAdd = (e) => {
    const files = Array.from(e.target.files);
    const room = 5 - photos.length;
    if (room <= 0) return;
    const accepted = files.slice(0, room);
    const previews = accepted.map((f) => ({ url: URL.createObjectURL(f), publicId: null, file: f }));
    setPhotos((prev) => [...prev, ...previews]);
    e.target.value = "";
  };

  const onPhotoRemove = (index) => {
    setPhotos((prev) => {
      const target = prev[index];
      if (target.publicId) {
        setRemovedPublicIds((ids) => [...ids, target.publicId]);
      } else {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Revoke any still-staged local previews if the user navigates away
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => {
    return () => {
      photosRef.current.forEach((p) => p.file && URL.revokeObjectURL(p.url));
    };
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
      photos.filter((p) => p.file).forEach((p) => fd.append("images", p.file));
      removedPublicIds.forEach((pid) => fd.append("removeImageIds", pid));
      await updateListing(id, fd);
      setSuccess(true);
      setTimeout(() => navigate("/my-listings"), 2000);
    } catch (error) {
      console.error("Failed to update pet listing", error);
      alert("Failed to update listing: " + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="text-center py-40">
      <Motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="inline-block"
      >
        <Save size={48} className="text-primary/20" />
      </Motion.div>
      <p className="mt-6 text-slate-400 font-bold text-lg leading-relaxed">Loading listing details...</p>
    </div>
  );

  if (success) {
    return (
      <div className="text-center py-40">
        <Motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-500 shadow-xl shadow-emerald-500/10">
            <CheckCircle size={48} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">Listing Updated!</h1>
          <p className="text-slate-500 text-lg font-medium">Your changes have been saved successfully. Redirecting...</p>
        </Motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 px-5">
      <Link to="/my-listings" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold mb-10 group">
        <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" /> Back to My Ads
      </Link>
      
      <div className="mb-12 py-8 border-b border-slate-200">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2 text-slate-900">Edit Listing</h1>
        <p className="text-slate-500 text-lg font-medium">Refine your pet's information to attract the perfect match.</p>
      </div>
      
      <Motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 md:p-12 bg-white shadow-2xl shadow-primary/10 border-slate-100"
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

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Photos</label>
            <div className="flex flex-wrap gap-3">
              {photos.map((photo, i) => (
                <div key={photo.publicId || photo.url} className="w-24 h-24 rounded-xl overflow-hidden border border-slate-200 relative group">
                  <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => onPhotoRemove(i)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    aria-label="Remove photo"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-primary hover:text-primary transition-all"
                >
                  <ImagePlus size={18} />
                  <span className="text-[10px] font-black">Add</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={onPhotoAdd} className="hidden" />
            <p className="text-xs text-slate-400 font-bold mt-2">Up to 5 photos. Hover a photo to remove it.</p>
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
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Age (Months)</label>
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
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Price (LKR) — 0 for free</label>
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
            <label className="flex text-xs font-black uppercase tracking-widest text-slate-400 mb-3 items-center gap-2">
              <Plus size={16} className="text-emerald-500 rotate-45" />
              Health & Vaccination Info
            </label>
            <textarea name="healthInfo" value={formData.healthInfo} onChange={onChange} required className="w-full px-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none h-28 font-semibold resize-none transition-all" />
          </div>

          <div>
            <label className="flex text-xs font-black uppercase tracking-widest text-slate-400 mb-3 items-center gap-2">
              <Info size={16} className="text-primary" />
              Detailed Description
            </label>
            <textarea name="description" value={formData.description} onChange={onChange} required className="w-full px-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none h-40 font-semibold resize-none transition-all" />
          </div>

          <button type="submit" disabled={submitting} className="btn btn-primary w-full py-5 text-xl relative group overflow-hidden">
            <span className="relative z-10 flex items-center justify-center gap-3">
              {submitting ? (
                <div className="animate-spin rounded-full h-6 w-6 border-4 border-white border-t-transparent" />
              ) : (
                <><Save size={24} /> Save Changes</>
              )}
            </span>
          </button>
        </form>
      </Motion.div>
    </div>
  );
};

export default EditListing;
