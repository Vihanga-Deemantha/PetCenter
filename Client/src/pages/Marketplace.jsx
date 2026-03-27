import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPets } from "../services/petService";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Search, Filter, MapPin, Tag, Plus, ArrowRight, Info } from "lucide-react";

const Marketplace = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ petType: "", location: "" });

  useEffect(() => {
    const fetchPets = async () => {
      setLoading(true);
      try {
        const data = await getPets(filters);
        setPets(data.data);
      } catch (error) {
        console.error("Failed to fetch pets", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPets();
  }, [filters]);

  return (
    <div className="marketplace-page pb-24">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 py-8 border-b border-slate-200 gap-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-2">
            Find Your <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Perfect Match.</span>
          </h1>
          <p className="text-slate-500 text-lg">Browse through verified pet listings from trusted owners.</p>
        </div>
        <Link to="/create-listing" className="btn btn-primary px-8">
          <Plus size={20} />
          Post a New Ad
        </Link>
      </div>

      {/* Filter Bar */}
      <Motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-card p-5 mb-16 flex flex-wrap gap-6 items-center bg-white shadow-sm"
      >
        <div className="flex-1 min-w-[300px] relative font-body">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={20} />
          <input 
            type="text" 
            placeholder="Search by breed or title..." 
            className="w-full pl-14 pr-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-400"
          />
        </div>
        
        <div className="flex flex-wrap gap-4">
          <select 
            onChange={(e) => setFilters({ ...filters, petType: e.target.value })}
            className="w-44 px-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer appearance-none font-semibold text-slate-700"
          >
            <option value="">All Species</option>
            <option value="dog">Dogs</option>
            <option value="cat">Cats</option>
            <option value="bird">Birds</option>
            <option value="fish">Fish</option>
            <option value="other">Other</option>
          </select>

          <div className="relative w-56 font-body">
            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-primary" size={20} />
            <input 
              type="text" 
              placeholder="Any Location" 
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              className="w-full pl-14 pr-6 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>
      </Motion.div>

      {/* Listings Grid */}
      {loading ? (
        <div className="text-center py-40">
          <Motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <Plus size={48} className="text-primary" />
          </Motion.div>
          <p className="mt-6 text-slate-500 font-bold text-lg">Fetching the best pets for you...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            <AnimatePresence>
              {pets.map((pet, index) => (
                <Motion.div 
                  layout
                  key={pet._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ y: -12 }}
                  className="glass-card overflow-hidden flex flex-col group"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={pet.images[0] || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1000"} 
                      alt={pet.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl font-black text-primary shadow-xl">
                      ${pet.price}
                    </div>
                  </div>

                  <div className="p-8 flex-1 flex flex-col">
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="badge badge-primary bg-indigo-50 text-indigo-700 px-3 py-1 text-[10px] font-black uppercase tracking-widest">{pet.petType}</span>
                        <span className={`badge px-3 py-1 text-[10px] font-black uppercase tracking-widest ${pet.listingType === 'sale' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          For {pet.listingType}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 group-hover:text-primary transition-colors">{pet.title}</h3>
                    </div>

                    <div className="flex gap-6 text-slate-500 text-sm font-semibold mb-8">
                      <span className="flex items-center gap-2"><Tag size={18} className="text-primary/60" /> {pet.breed}</span>
                      <span className="flex items-center gap-2"><MapPin size={18} className="text-primary/60" /> {pet.location}</span>
                    </div>

                    <div className="mt-auto pt-6 border-t border-slate-100">
                      <Link to={`/marketplace/${pet._id}`} className="btn w-full bg-slate-50 text-primary hover:bg-primary hover:text-white transition-all duration-300 font-black">
                        View Details <ArrowRight size={18} />
                      </Link>
                    </div>
                  </div>
                </Motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {pets.length === 0 && (
            <div className="text-center py-24">
              <div className="bg-slate-100 p-8 rounded-full inline-flex mb-8">
                <Info size={48} className="text-slate-400" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">No pets found</h2>
              <p className="text-slate-500 font-medium">Try adjusting your search or filters to find what you're looking for.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Marketplace;
