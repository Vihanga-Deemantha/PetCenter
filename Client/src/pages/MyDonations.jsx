import React, { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { Heart, Calendar, ArrowRight, Gift, MessageSquare, AlertCircle } from "lucide-react";
import { getMyDonations } from "../api/donation.api";
import { useAuth } from "../context/AuthContext";

const MyDonations = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    getMyDonations()
      .then((res) => {
        setDonations(res.data.data || []);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to load donations history.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-secondary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6">
      {/* Header */}
      <Motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="mb-10"
      >
        <span className="inline-flex items-center gap-1.5 px-3 px-1.5 bg-rose-50 text-secondary rounded-full text-xs font-black uppercase tracking-widest border border-rose-100 mb-4">
          <Heart size={12} className="fill-current" /> Giving Ledger
        </span>
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-slate-900 mb-2">
          My <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">Donations</span>
        </h1>
        <p className="text-slate-500 text-lg font-semibold max-w-2xl">
          An overview of your contributions to charitable campaigns helping animals around the world.
        </p>
      </Motion.div>

      {error ? (
        <div className="flex items-center gap-3 p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 max-w-xl">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      ) : donations.length === 0 ? (
        <Motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card text-center py-20 bg-white/70 max-w-xl mx-auto"
        >
          <Gift size={48} className="mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-black text-slate-900 mb-2">No Donations Yet</h3>
          <p className="text-slate-400 text-sm font-semibold mb-6">
            You haven't made any contributions yet. Explore our active campaigns to find a cause you care about.
          </p>
          <Link 
            to="/campaigns"
            className="btn btn-primary bg-gradient-to-br from-secondary to-accent shadow-rose-500/20 py-3 px-6 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5 inline-flex"
          >
            Explore Campaigns <ArrowRight size={13} />
          </Link>
        </Motion.div>
      ) : (
        /* Donations List */
        <div className="space-y-6 max-w-3xl">
          {donations.map((don, idx) => {
            const campaign = don.campaignId;
            if (!campaign) return null;

            return (
              <Motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={don._id}
                className="glass-card p-6 bg-white/95 border border-slate-100 flex flex-col sm:flex-row justify-between gap-6"
              >
                {/* Campaign Link & Image info */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    <img 
                      src={campaign.images?.[0]?.url || "https://images.unsplash.com/photo-1548199973-03cce0bbc87b"} 
                      alt={campaign.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-1 block">
                      {campaign.category}
                    </span>
                    <h3 className="text-base font-black text-slate-950 hover:text-secondary transition-colors">
                      <Link to={`/campaigns/${campaign._id}`}>{campaign.title}</Link>
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold mt-1">
                      <Calendar size={12} className="text-slate-300" />
                      <span>{new Date(don.createdAt).toLocaleDateString()}</span>
                    </div>

                    {don.message && (
                      <div className="flex items-start gap-1 p-2.5 bg-slate-50 border border-slate-100 rounded-xl mt-3 text-slate-500 text-xs font-medium max-w-md">
                        <MessageSquare size={13} className="shrink-0 mt-0.5 text-slate-400" />
                        <span>"{don.message}"</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Amount information */}
                <div className="sm:text-right shrink-0 flex flex-col justify-between items-start sm:items-end">
                  <div>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Contribution</span>
                    <span className="text-2xl font-black text-secondary">${(don.amount / 100).toFixed(2)}</span>
                  </div>
                  
                  <Link
                    to={`/campaigns/${campaign._id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:text-indigo-700 mt-4 sm:mt-0 transition-colors"
                  >
                    View Cause <ArrowRight size={13} />
                  </Link>
                </div>
              </Motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyDonations;
