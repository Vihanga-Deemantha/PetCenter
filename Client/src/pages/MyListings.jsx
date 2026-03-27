import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyPets, deletePet } from "../services/petService";
import { motion as Motion } from "framer-motion";
import { Trash2, Edit, ExternalLink, Plus } from "lucide-react";

const MyListings = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    fetchMyPets();
  }, []);

  const fetchMyPets = async () => {
    try {
      const data = await getMyPets();
      setPets(data.data);
    } catch (error) {
      console.error("Failed to fetch my pets", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this listing?")) {
      setDeleteLoading(id);
      try {
        await deletePet(id);
        setPets(pets.filter(p => p._id !== id));
      } catch (error) {
        console.error("Delete failed", error);
        alert("Failed to delete listing");
      } finally {
        setDeleteLoading(null);
      }
    }
  };

  return (
    <div className="my-listings-page pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 py-8 border-b border-slate-200 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">My Pet Listings</h1>
          <p className="text-slate-500 text-lg font-medium">Manage and monitor your active advertisements.</p>
        </div>
        <Link to="/create-listing" className="btn btn-primary px-8">
          <Plus size={20} />
          Post New Ad
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-40">
          <Motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <Plus size={48} className="text-primary" />
          </Motion.div>
          <p className="mt-6 text-slate-500 font-bold text-lg">Loading your listings...</p>
        </div>
      ) : pets.length === 0 ? (
        <Motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-20 text-center bg-white shadow-sm"
        >
          <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-300">
            <Plus size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">No listings found</h2>
          <p className="text-slate-500 text-lg mb-10 max-w-md mx-auto">You haven't posted any pet ads yet. Share your pets with our community!</p>
          <Link to="/create-listing" className="btn btn-primary px-12 py-4">Get Started Today</Link>
        </Motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pets.map((pet, index) => (
            <Motion.div 
              key={pet._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -8 }}
              className="glass-card p-6 flex gap-6 items-center bg-white border-slate-100 shadow-sm group"
            >
              <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 shadow-inner bg-slate-100">
                <img 
                  src={pet.images[0] || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1000"} 
                  alt={pet.title} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-black text-slate-900 truncate mb-1 group-hover:text-primary transition-colors">{pet.title}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-primary font-black text-lg">${pet.price}</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">{pet.status || 'Active'}</span>
                </div>
                <div className="flex gap-3">
                  <Link to={`/marketplace/${pet._id}`} className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm" title="View Listing">
                    <ExternalLink size={18} />
                  </Link>
                  <Link to={`/edit-listing/${pet._id}`} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="Edit Listing">
                    <Edit size={18} />
                  </Link>
                  <button 
                    onClick={() => handleDelete(pet._id)} 
                    disabled={deleteLoading === pet._id}
                    className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
                    title="Delete Listing"
                  >
                    {deleteLoading === pet._id ? (
                      <div className="animate-spin rounded-full h-4.5 w-4.5 border-2 border-current border-t-transparent" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
              </div>
            </Motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyListings;
