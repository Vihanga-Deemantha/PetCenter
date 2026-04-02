import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyListings, deleteListing } from "../api/listing.api";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Trash2, Edit, ExternalLink, Plus, AlertCircle, CheckCircle, X } from "lucide-react";

const statusColors = {
  active: "bg-emerald-50 text-emerald-600",
  pending: "bg-amber-50 text-amber-600",
  sold: "bg-slate-100 text-slate-500",
  adopted: "bg-blue-50 text-blue-600",
  removed: "bg-rose-50 text-rose-600",
};

const MyListings = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // id to confirm
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchMyPets();
  }, []);

  const fetchMyPets = async () => {
    try {
      const data = await getMyListings();
      setPets(data.data);
    } catch (err) {
      console.error("Failed to fetch my pets", err);
      setError("Failed to load listings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleteLoading(id);
    setConfirmDelete(null);
    setError("");
    try {
      await deleteListing(id);
      setPets(pets.filter((p) => p._id !== id));
      setSuccess("Listing removed successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Delete failed", err);
      setError(err.response?.data?.message || "Failed to delete listing. Please try again.");
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div className="my-listings-page pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 py-8 border-b border-slate-200 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">My Pet Listings</h1>
          <p className="text-slate-500 text-lg font-medium">Manage and monitor your active advertisements.</p>
        </div>
        <Link to="/create-listing" className="btn btn-primary px-8">
          <Plus size={20} /> Post New Ad
        </Link>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {success && (
          <Motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-600 rounded-xl mb-8 border border-emerald-100 text-sm font-bold"
          >
            <CheckCircle size={18} /> {success}
          </Motion.div>
        )}
        {error && (
          <Motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-rose-50 text-rose-600 rounded-xl mb-8 border border-rose-100 text-sm font-bold"
          >
            <AlertCircle size={18} /> {error}
            <button onClick={() => setError("")} className="ml-auto"><X size={16} /></button>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Banner */}
      <AnimatePresence>
        {confirmDelete && (
          <Motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
          >
            <div className="bg-white rounded-[28px] shadow-2xl shadow-rose-500/10 max-w-sm w-full p-8 border border-slate-100">
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash2 size={28} className="text-rose-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-2 text-center">Remove Listing?</h2>
              <p className="text-slate-500 text-center font-medium mb-8">
                This will remove the listing from the marketplace. This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-700 font-black rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="flex-1 py-4 bg-rose-500 text-white font-black rounded-xl hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/30"
                >
                  Yes, Remove
                </button>
              </div>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="text-center py-40">
          <Motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-xl shadow-primary/30 mb-4"
          >
            <Plus size={28} className="text-white" />
          </Motion.div>
          <p className="mt-4 text-slate-500 font-bold text-lg">Loading your listings...</p>
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
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">No listings yet</h2>
          <p className="text-slate-500 text-lg mb-10 max-w-md mx-auto">
            You haven't posted any pet ads yet. Share your pets with our community!
          </p>
          <Link to="/create-listing" className="btn btn-primary px-12 py-4">
            Get Started Today
          </Link>
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
                  src={pet.images?.[0] || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400"}
                  alt={pet.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-black text-slate-900 truncate mb-1 group-hover:text-primary transition-colors">
                  {pet.title}
                </h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-primary font-black text-lg">
                    {pet.listingType === "adoption" ? "FREE" : `LKR ${pet.price?.toLocaleString()}`}
                  </span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span className={`text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${statusColors[pet.status] || "bg-slate-50 text-slate-500"}`}>
                    {pet.status}
                  </span>
                </div>
                <div className="flex gap-3">
                  <Link
                    to={`/marketplace/${pet._id}`}
                    className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                    title="View Listing"
                  >
                    <ExternalLink size={18} />
                  </Link>
                  <Link
                    to={`/edit-listing/${pet._id}`}
                    className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    title="Edit Listing"
                  >
                    <Edit size={18} />
                  </Link>
                  <button
                    onClick={() => setConfirmDelete(pet._id)}
                    disabled={deleteLoading === pet._id}
                    className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
                    title="Remove Listing"
                  >
                    {deleteLoading === pet._id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
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
