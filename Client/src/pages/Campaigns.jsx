import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Search, Heart, DollarSign, Users, Award, Clock, ArrowRight, Activity, Filter } from "lucide-react";
import { getCampaigns } from "../api/campaign.api";

const CATEGORIES = [
  { value: "", label: "All Causes" },
  { value: "medical", label: "Medical Aid" },
  { value: "shelter", label: "Shelter Builds" },
  { value: "food", label: "Pet Food supply" },
  { value: "rescue", label: "Rescue Missions" },
  { value: "rehabilitation", label: "Rehab Care" },
  { value: "general", label: "General Funds" },
];

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 9 };
      if (search) params.search = search;
      if (category) params.category = category;
      
      const res = await getCampaigns(params);
      setCampaigns(res.data.data || []);
      setPagination(res.data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 });
    } catch (err) {
      console.error(err);
      setCampaigns([]);
    }
    setLoading(false);
  }, [page, search, category]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Aggregate stats from fetched campaigns for top cards
  const statsTotalRaised = campaigns.reduce((acc, c) => acc + c.raisedAmount, 0);
  const statsTotalDonors = campaigns.reduce((acc, c) => acc + c.donorCount, 0);

  // Divide into featured, regular active, and finished
  const featuredCampaigns = campaigns.filter(c => c.featuredOrder !== null && c.status === "active");
  const activeCampaigns = campaigns.filter(c => c.status === "active" && c.featuredOrder === null);
  const completedOrClosed = campaigns.filter(c => ["goal_reached", "expired", "closed"].includes(c.status));

  return (
    <div className="min-h-screen py-6">
      {/* ─── Hero Section ────────────────────────────────────────────────────── */}
      <Motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="mb-12 text-center md:text-left md:flex md:items-center md:justify-between border-b border-slate-100 pb-10"
      >
        <div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-50 text-secondary rounded-full text-xs font-black uppercase tracking-widest border border-rose-100 mb-4">
            <Heart size={12} className="fill-current" /> Save Lives & Support Shelters
          </span>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-slate-900 mb-3">
            Charitable <span className="bg-linear-to-r from-secondary to-accent bg-clip-text text-transparent">Campaigns</span>
          </h1>
          <p className="text-slate-500 text-lg font-semibold max-w-2xl">
            Join hands with local shelters. 100% of your contributions go directly to helping animals in need of medical aid, food, and homes.
          </p>
        </div>

        {/* Hero Mini Stats */}
        <div className="mt-8 md:mt-0 flex gap-4 justify-center">
          <div className="glass-card p-5 text-center min-w-32 bg-white/80">
            <DollarSign className="mx-auto text-secondary mb-1" size={24} />
            <h4 className="text-xl font-black text-slate-900">${(statsTotalRaised / 100).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</h4>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Raised Today</p>
          </div>
          <div className="glass-card p-5 text-center min-w-32 bg-white/80">
            <Users className="mx-auto text-primary mb-1" size={24} />
            <h4 className="text-xl font-black text-slate-900">{statsTotalDonors}</h4>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Total Donors</p>
          </div>
        </div>
      </Motion.div>

      {/* ─── Search and Filters Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between mb-10">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <Filter size={16} className="text-slate-400 shrink-0 mr-1" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => { setCategory(cat.value); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer whitespace-nowrap ${
                category === cat.value
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-sm focus:ring-2 focus:ring-secondary/20 outline-none"
          />
        </div>
      </div>

      {/* ─── Featured Section ────────────────────────────────────────────────── */}
      {featuredCampaigns.length > 0 && page === 1 && !category && (
        <div className="mb-14">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-6 flex items-center gap-2">
            <Award className="text-secondary" size={22} /> Featured Urgent Causes
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {featuredCampaigns.map((camp) => {
              const progress = Math.min(100, (camp.raisedAmount / camp.goalAmount) * 100);
              return (
                <Motion.div
                  key={camp._id}
                  whileHover={{ y: -6 }}
                  className="glass-card overflow-hidden bg-white/95 border border-slate-100 flex flex-col md:flex-row h-full"
                >
                  {/* Image */}
                  <div className="md:w-1/2 h-52 md:h-auto relative">
                    <img 
                      src={camp.images[0]?.url || "https://images.unsplash.com/photo-1548199973-03cce0bbc87b"} 
                      alt={camp.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 bg-secondary text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow">
                      Urgent
                    </div>
                  </div>

                  {/* Details */}
                  <div className="md:w-1/2 p-6 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-1 block">
                        {camp.category}
                      </span>
                      <h3 className="text-xl font-black text-slate-900 line-clamp-1 mb-2 hover:text-secondary transition-colors">
                        <Link to={`/campaigns/${camp._id}`}>{camp.title}</Link>
                      </h3>
                      <p className="text-slate-400 text-xs font-semibold line-clamp-3 mb-4">
                        {camp.shortDescription}
                      </p>
                    </div>

                    <div>
                      {/* Progress */}
                      <div className="space-y-1 mb-4">
                        <div className="flex justify-between text-xs font-black">
                          <span className="text-slate-950">${(camp.raisedAmount / 100).toLocaleString()} <span className="text-slate-400 font-semibold">raised</span></span>
                          <span className="text-secondary">{progress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-linear-to-r from-secondary to-accent" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                          <span>Goal: ${(camp.goalAmount / 100).toLocaleString()}</span>
                          {camp.deadline && (
                            <span className="flex items-center gap-1">
                              <Clock size={10} /> {new Date(camp.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <Link 
                        to={`/campaigns/${camp._id}`}
                        className="btn btn-primary bg-linear-to-r from-secondary to-accent shadow-rose-500/20 w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5"
                      >
                        Help Now <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </Motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Active Campaigns Grid ─────────────────────────────────────────── */}
      <div className="mb-14">
        <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-6 flex items-center gap-2">
          <Activity className="text-primary" size={22} /> Active Fundraising
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-card bg-slate-100 animate-pulse aspect-4/5" />
            ))}
          </div>
        ) : activeCampaigns.length === 0 && featuredCampaigns.length === 0 ? (
          <div className="glass-card text-center py-16 bg-white/70">
            <Heart size={40} className="mx-auto mb-3 text-slate-300" />
            <h3 className="text-lg font-black text-slate-900 mb-1">No Active Campaigns</h3>
            <p className="text-slate-400 text-sm font-semibold">We couldn't find any campaigns matching your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCampaigns.map((camp) => {
              const progress = Math.min(100, (camp.raisedAmount / camp.goalAmount) * 100);
              return (
                <Motion.div
                  key={camp._id}
                  whileHover={{ y: -5 }}
                  className="glass-card overflow-hidden bg-white/95 border border-slate-100 flex flex-col justify-between h-full"
                >
                  <div>
                    {/* Image */}
                    <div className="h-44 relative">
                      <img 
                        src={camp.images[0]?.url || "https://images.unsplash.com/photo-1548199973-03cce0bbc87b"} 
                        alt={camp.title} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-wider text-slate-800 shadow">
                        {camp.category}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 pb-2">
                      <h3 className="text-lg font-black text-slate-900 line-clamp-1 mb-2 hover:text-secondary transition-colors">
                        <Link to={`/campaigns/${camp._id}`}>{camp.title}</Link>
                      </h3>
                      <p className="text-slate-400 text-xs font-semibold line-clamp-3">
                        {camp.shortDescription}
                      </p>
                    </div>
                  </div>

                  {/* Progress & Donate */}
                  <div className="p-6 pt-0">
                    <div className="space-y-1.5 mb-4">
                      <div className="flex justify-between text-xs font-black">
                        <span className="text-slate-950">${(camp.raisedAmount / 100).toLocaleString()} <span className="text-slate-400 font-semibold">raised</span></span>
                        <span className="text-secondary">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-linear-to-r from-secondary to-accent" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                        <span>Goal: ${(camp.goalAmount / 100).toLocaleString()}</span>
                        {camp.deadline && (
                          <span className="flex items-center gap-0.5">
                            <Clock size={9} /> {new Date(camp.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <Link 
                      to={`/campaigns/${camp._id}`}
                      className="btn btn-primary bg-linear-to-r from-secondary to-accent shadow-rose-500/10 w-full py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1"
                    >
                      Give Gift <ArrowRight size={12} />
                    </Link>
                  </div>
                </Motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Past Completed & Closed Campaigns Section ──────────────────────── */}
      {completedOrClosed.length > 0 && (
        <div className="border-t border-slate-100 pt-10 mb-10">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-6">
            Completed & Past Campaigns
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
            {completedOrClosed.map((camp) => (
              <div key={camp._id} className="glass-card overflow-hidden bg-slate-50/50 border-slate-100 flex flex-col justify-between h-full filter grayscale">
                <div>
                  <div className="h-32 relative">
                    <img 
                      src={camp.images[0]?.url || "https://images.unsplash.com/photo-1548199973-03cce0bbc87b"} 
                      alt={camp.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-wider shadow">
                      {camp.status === "goal_reached" ? "Goal Met 🎉" : "Closed"}
                    </div>
                  </div>
                  <div className="p-5">
                    <h4 className="font-black text-slate-700 line-clamp-1 mb-1">
                      <Link to={`/campaigns/${camp._id}`}>{camp.title}</Link>
                    </h4>
                    <p className="text-slate-400 text-[11px] font-bold">
                      Raised ${(camp.raisedAmount / 100).toLocaleString()} of ${(camp.goalAmount / 100).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-10">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 font-black text-xs text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Prev
          </button>
          <span className="text-xs font-black text-slate-500">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 font-black text-xs text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
