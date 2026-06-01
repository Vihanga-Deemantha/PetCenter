import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ArrowRight, MapPin, Tag } from "lucide-react";
import { getListings } from "../../api/listing.api";
import PetBounceIcon from "../animations/PetBounceIcon";

const FeaturedPetsSection = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const { data } = await getListings({ limit: 4, sort: "-createdAt" });
        setPets(data || []);
      } catch (error) {
        console.error("Failed to fetch featured pets", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPets();
  }, []);

  return (
    <section className="py-32 px-[5%] max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
        <div>
          <span className="text-primary font-black uppercase tracking-widest text-xs mb-4 block">New Arrivals</span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-950 tracking-tighter leading-tight">
            <PetBounceIcon emoji="🐾" delay={0} />{" "}Find your perfect <br/> companion.
          </h2>
        </div>
        <Link to="/marketplace" className="group flex items-center gap-3 font-black text-slate-900 border-b-2 border-primary pb-1 transition-all hover:text-primary">
          View Marketplace <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex flex-col gap-4">
              <div className="h-64 bg-slate-100 rounded-3xl" />
              <div className="h-6 bg-slate-100 w-2/3 rounded-full" />
              <div className="h-4 bg-slate-50 w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {pets.length > 0 ? (
            pets.map((pet, i) => (
              <Motion.div 
                key={pet._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group cursor-pointer"
              >
                <Link to={`/marketplace/${pet._id}`}>
                  <div className="relative rounded-[40px] overflow-hidden aspect-4/5 mb-6 shadow-2xl shadow-indigo-500/5 group-hover:shadow-indigo-500/10 transition-all border border-slate-50">
                    <img 
                      src={pet.images?.[0] || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1000"} 
                      alt={pet.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute top-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-white/20">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">{pet.listingType === "adoption" ? "FREE" : `LKR ${pet.price?.toLocaleString()}`}</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-4">
                    <h3 className="text-xl font-black text-slate-900 mb-2 truncate">{pet.title}</h3>
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                      <MapPin size={16} className="text-primary/40" />
                      {pet.location}
                    </div>
                  </div>
                </Link>
              </Motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center glass-card bg-slate-50 border-2 border-dashed border-slate-200">
               <p className="text-slate-400 font-black">No pets available right now. Check back later!</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default FeaturedPetsSection;
