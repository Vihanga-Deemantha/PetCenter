import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getDashboardStats,
  getAdminListings,
  getAdminUsers,
  approveListing,
  rejectListing,
  removeListingAdmin,
  blockUser,
  unblockUser,
} from "../api/admin.api";
import { motion as Motion, AnimatePresence } from "framer-motion";
import {
  Activity, Users, ClipboardList, BarChart3, CheckCircle,
  XCircle, Clock, Trash2, ShieldOff, ShieldCheck, Search,
  RefreshCw, Eye, AlertCircle, ShoppingBag, Heart, DollarSign,
  TrendingUp, TrendingDown, Calendar, AlertTriangle, ChevronRight,
  Sparkles, Check, Flame, Gift
} from "lucide-react";
import { Link } from "react-router-dom";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);


const StatusBadge = ({ status }) => {
  const map = {
    active: "bg-emerald-50 text-emerald-700",
    pending: "bg-amber-50 text-amber-700",
    sold: "bg-slate-100 text-slate-500",
    adopted: "bg-blue-50 text-blue-700",
    removed: "bg-rose-50 text-rose-700",
  };
  return (
    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${map[status] || "bg-slate-50 text-slate-500"}`}>
      {status}
    </span>
  );
};

// ── Reject Modal ─────────────────────────────────────────────────────────────
const RejectModal = ({ listingId, onConfirm, onCancel }) => {
  const [note, setNote] = useState("Does not meet community guidelines");
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    await onConfirm(listingId, note);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <Motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-[28px] shadow-2xl max-w-md w-full p-8 border border-slate-100"
      >
        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <XCircle size={28} className="text-rose-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-2 text-center">Reject Listing</h2>
        <p className="text-slate-500 text-center text-sm font-medium mb-6">
          Provide a reason for rejection. This helps the owner understand what to improve.
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full px-5 py-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-rose-500/20 outline-none font-semibold resize-none h-24 text-sm mb-6"
          placeholder="Rejection reason..."
        />
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 py-4 bg-slate-100 text-slate-700 font-black rounded-xl hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="flex-1 py-4 bg-rose-500 text-white font-black rounded-xl hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/30 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <><XCircle size={18} /> Reject</>
            )}
          </button>
        </div>
      </Motion.div>
    </div>
  );
};

const AdminDashboard = ({ activeTabOverride = "overview" }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(activeTabOverride);

  useEffect(() => {
    setActiveTab(activeTabOverride);
  }, [activeTabOverride]);
  const [stats, setStats] = useState(null);
  const [listings, setListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [listingFilter, setListingFilter] = useState("pending");
  const [listingSearch, setListingSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState(null); // listing id
  const [actionError, setActionError] = useState("");

  // --- plain async helpers for imperative calls (approve/reject/etc.) ---
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await getDashboardStats();
      setStats(res.data);
    } catch { /* ignore */ }
    setStatsLoading(false);
  };

  const fetchListings = async (filter = listingFilter, search = listingSearch) => {
    setListingsLoading(true);
    try {
      const params = {};
      if (filter) params.status = filter;
      if (search) params.search = search;
      const res = await getAdminListings(params);
      setListings(res.data);
    } catch { /* ignore */ }
    setListingsLoading(false);
  };

  const fetchUsers = async (search = userSearch) => {
    setUsersLoading(true);
    try {
      const params = search ? { search } : {};
      const res = await getAdminUsers(params);
      setUsers(res.data);
    } catch { /* ignore */ }
    setUsersLoading(false);
  };

  // Fetch stats on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setStatsLoading(true);
      try {
        const res = await getDashboardStats();
        if (!cancelled) setStats(res.data);
      } catch { /* ignore */ }
      if (!cancelled) setStatsLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Fetch listings when tab or filters change
  useEffect(() => {
    if (activeTab !== "listings") return;
    let cancelled = false;
    const load = async () => {
      setListingsLoading(true);
      try {
        const params = {};
        if (listingFilter) params.status = listingFilter;
        if (listingSearch) params.search = listingSearch;
        const res = await getAdminListings(params);
        if (!cancelled) setListings(res.data);
      } catch { /* ignore */ }
      if (!cancelled) setListingsLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [activeTab, listingFilter, listingSearch]);

  // Fetch users when tab or search changes
  useEffect(() => {
    if (activeTab !== "users") return;
    let cancelled = false;
    const load = async () => {
      setUsersLoading(true);
      try {
        const params = userSearch ? { search: userSearch } : {};
        const res = await getAdminUsers(params);
        if (!cancelled) setUsers(res.data);
      } catch { /* ignore */ }
      if (!cancelled) setUsersLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [activeTab, userSearch]);

  const handleApprove = async (id) => {
    setLoadingId(id);
    setActionError("");
    try {
      await approveListing(id);
      await fetchListings();
      await fetchStats();
    } catch (e) {
      setActionError(e.response?.data?.message || "Failed to approve listing");
    }
    setLoadingId(null);
  };

  const handleRejectConfirm = async (id, note) => {
    setLoadingId(id);
    setActionError("");
    try {
      await rejectListing(id, note);
      await fetchListings();
      await fetchStats();
    } catch (e) {
      setActionError(e.response?.data?.message || "Failed to reject listing");
    }
    setLoadingId(null);
    setRejectModal(null);
  };

  const handleRemove = async (id) => {
    setLoadingId(id);
    setActionError("");
    try {
      await removeListingAdmin(id);
      await fetchListings();
      await fetchStats();
    } catch (e) {
      setActionError(e.response?.data?.message || "Failed to remove listing");
    }
    setLoadingId(null);
  };

  const handleBlockToggle = async (u) => {
    setLoadingId(u._id);
    setActionError("");
    try {
      if (u.isBlocked) { await unblockUser(u._id); }
      else { await blockUser(u._id); }
      await fetchUsers();
    } catch (e) {
      setActionError(e.response?.data?.message || "Action failed");
    }
    setLoadingId(null);
  };

  const Trend = ({ value }) => {
    if (value === 0) return <span className="text-slate-400 text-xs font-bold">0% WoW</span>;
    const isPositive = value > 0;
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs font-black ${isPositive ? "text-emerald-500" : "text-rose-500"}`}>
        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {isPositive ? "+" : ""}{value}% WoW
      </span>
    );
  };

  const statCards = stats?.cards ? [
    { label: "Total Users", value: stats.cards.users.total, trend: stats.cards.users.trend, icon: <Users size={22} />, color: "bg-primary/10 text-primary border-primary/20", onClick: () => setActiveTab("users") },
    { label: "Pet Listings", value: stats.cards.listings.total, trend: stats.cards.listings.trend, icon: <ClipboardList size={22} />, color: "bg-emerald-50 text-emerald-600 border-emerald-100", onClick: () => setActiveTab("listings") },
    { label: "Store Products", value: stats.cards.products.total, trend: stats.cards.products.trend, icon: <ShoppingBag size={22} />, color: "bg-amber-50 text-amber-600 border-amber-100", onClick: null },
    { label: "Orders Count", value: stats.cards.orders.total, trend: stats.cards.orders.trend, icon: <Activity size={22} />, color: "bg-rose-50 text-rose-600 border-rose-100", onClick: null },
    { label: "Store Revenue", value: `$${stats.cards.revenue.totalInDollars}`, trend: stats.cards.revenue.trend, icon: <DollarSign size={22} />, color: "bg-primary/10 text-primary border-primary/20", onClick: null },
    { label: "Active Campaigns", value: stats.cards.campaigns.total, trend: stats.cards.campaigns.trend, icon: <Flame size={22} />, color: "bg-rose-50 text-rose-600 border-rose-100", onClick: null },
    { label: "Donation Count", value: stats.cards.donations.total, trend: stats.cards.donations.trend, icon: <Heart size={22} />, color: "bg-pink-50 text-pink-600 border-pink-100", onClick: null },
    { label: "Donation Revenue", value: `$${stats.cards.donationRevenue.totalInDollars}`, trend: stats.cards.donationRevenue.trend, icon: <Gift size={22} />, color: "bg-purple-50 text-purple-600 border-purple-100", onClick: null },
  ] : [];

  return (
    <div className="admin-dashboard pb-24 max-w-7xl mx-auto">
      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModal && (
          <RejectModal
            listingId={rejectModal}
            onConfirm={handleRejectConfirm}
            onCancel={() => setRejectModal(null)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-10 py-8 border-b border-slate-200 flex items-start justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2 text-slate-900">Admin Control Center</h1>
          <p className="text-slate-500 text-lg font-medium">
            Welcome, <span className="text-primary font-black">{user?.name}</span>
          </p>
        </div>
        <button onClick={fetchStats} className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-primary/10 hover:text-primary transition-all cursor-pointer" title="Refresh stats">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Action Error */}
      <AnimatePresence>
        {actionError && (
          <Motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-4 bg-rose-50 text-rose-600 rounded-xl mb-8 border border-rose-100 text-sm font-bold"
          >
            <AlertCircle size={18} /> {actionError}
            <button onClick={() => setActionError("")} className="ml-auto text-rose-400 hover:text-rose-600">✕</button>
          </Motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* ── Overview Tab ─────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <Motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-10">
            {statsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="glass-card p-6 h-32 animate-pulse bg-slate-100" />
                ))}
              </div>
            ) : (
              /* Stat Cards Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, i) => (
                  <Motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={stat.onClick || undefined}
                    className={`glass-card p-6 bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all ${stat.onClick ? "cursor-pointer" : ""}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
                        <div className="mt-2">
                          <Trend value={stat.trend} />
                        </div>
                      </div>
                      <div className={`p-3 rounded-2xl border ${stat.color}`}>
                        {stat.icon}
                      </div>
                    </div>
                  </Motion.div>
                ))}
              </div>
            )}

            {/* Interactive Charts Section */}
            {stats?.charts && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Platform Growth Chart */}
                <div className="glass-card p-6 bg-white border border-slate-100 shadow-sm">
                  <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-1.5">
                    <Sparkles size={16} className="text-primary" /> Platform Interactions (30 Days)
                  </h3>
                  <div className="h-64">
                    <Line
                      data={{
                        labels: stats.charts.labels,
                        datasets: [
                          { label: "New Signups", data: stats.charts.users, borderColor: "#6366f1", backgroundColor: "rgba(99, 102, 241, 0.04)", fill: true, tension: 0.3, borderWidth: 2.5 },
                          { label: "Store Orders", data: stats.charts.orders, borderColor: "#8b5cf6", backgroundColor: "rgba(139, 92, 246, 0.04)", fill: true, tension: 0.3, borderWidth: 2.5 },
                          { label: "Campaign Donations", data: stats.charts.donations, borderColor: "#f43f5e", backgroundColor: "rgba(244, 63, 94, 0.04)", fill: true, tension: 0.3, borderWidth: 2.5 }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { labels: { font: { family: "Outfit", weight: "bold", size: 10 } } } },
                        scales: { x: { grid: { display: false } }, y: { ticks: { stepSize: 1 } } }
                      }}
                    />
                  </div>
                </div>

                {/* Earnings Revenue Lines */}
                <div className="glass-card p-6 bg-white border border-slate-100 shadow-sm">
                  <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-1.5">
                    <DollarSign size={16} className="text-secondary" /> Daily Revenue ($ USD)
                  </h3>
                  <div className="h-64">
                    <Line
                      data={{
                        labels: stats.charts.labels,
                        datasets: [
                          { label: "Store Earnings", data: stats.charts.orderRevenue, borderColor: "#6366f1", backgroundColor: "rgba(99, 102, 241, 0.04)", fill: true, tension: 0.3, borderWidth: 2.5 },
                          { label: "Donation Contributions", data: stats.charts.donationRevenue, borderColor: "#f43f5e", backgroundColor: "rgba(244, 63, 94, 0.04)", fill: true, tension: 0.3, borderWidth: 2.5 }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { labels: { font: { family: "Outfit", weight: "bold", size: 10 } } } },
                        scales: { x: { grid: { display: false } } }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bestsellers and Stock Alerts */}
            {stats?.productStats && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Bestsellers Table (ColSpan 2) */}
                <div className="glass-card p-6 bg-white border border-slate-100 shadow-sm lg:col-span-2">
                  <h3 className="text-base font-black text-slate-900 mb-4">Top 5 Bestselling Products</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm font-semibold text-slate-600">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                          <th className="pb-3">Product</th>
                          <th className="pb-3">Category</th>
                          <th className="pb-3">Price</th>
                          <th className="pb-3 text-right">Units Sold</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {stats.productStats.topSelling.map((p) => (
                          <tr key={p._id}>
                            <td className="py-3 font-black text-slate-900">{p.name}</td>
                            <td className="py-3 capitalize text-xs">{p.category}</td>
                            <td className="py-3">${p.priceInDollars}</td>
                            <td className="py-3 text-right font-black text-primary">{p.soldCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Stock Alerts (ColSpan 1) */}
                <div className="glass-card p-6 bg-white border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                    <AlertTriangle size={18} className="text-amber-500" /> Stock Status
                  </h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-black text-rose-700">{stats.productStats.outOfStock}</div>
                        <div className="text-[10px] text-rose-500 font-black uppercase tracking-wider">Out of Stock Items</div>
                      </div>
                      <XCircle size={28} className="text-rose-400" />
                    </div>
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-black text-amber-700">{stats.productStats.lowStock}</div>
                        <div className="text-[10px] text-amber-500 font-black uppercase tracking-wider">Low Stock Items (1-5)</div>
                      </div>
                      <AlertTriangle size={28} className="text-amber-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Unified Chronological Activity Feed */}
            {stats?.timeline && (
              <div className="glass-card p-6 bg-white border border-slate-100 shadow-sm">
                <h3 className="text-base font-black text-slate-900 mb-6 flex items-center gap-2">
                  <Activity className="text-primary" size={18} /> Live Platform Timeline
                </h3>
                <div className="relative border-l border-slate-100 pl-6 ml-3 space-y-6">
                  {stats.timeline.map((act) => {
                    // Type styling map
                    const typeMap = {
                      user_signup: { bg: "bg-primary/10 text-primary border-primary/20", icon: <Users size={14} /> },
                      product_order: { bg: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: <ShoppingBag size={14} /> },
                      campaign_donation: { bg: "bg-rose-50 text-rose-600 border-rose-100", icon: <Heart size={14} /> }
                    };
                    const meta = typeMap[act.type] || { bg: "bg-slate-50 text-slate-600 border-slate-200", icon: <Activity size={14} /> };
                    
                    return (
                      <div key={act.id} className="relative">
                        {/* Bullet Circle Icon */}
                        <div className={`absolute -left-[37px] top-0.5 p-2 rounded-full border bg-white ${meta.bg}`}>
                          {meta.icon}
                        </div>
                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                            <h4 className="text-sm font-black text-slate-900">{act.title}</h4>
                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                              <Calendar size={10} /> {new Date(act.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-slate-500 text-xs font-semibold">{act.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Motion.div>
        )}

        {/* ── Listings Tab ─────────────────────────────────────────── */}
        {activeTab === "listings" && (
          <Motion.div key="listings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Filter Bar */}
            <div className="flex flex-wrap gap-4 mb-8 items-center">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                <input
                  type="text"
                  placeholder="Search listings..."
                  value={listingSearch}
                  onChange={(e) => setListingSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchListings()}
                  className="pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none font-semibold text-sm"
                />
              </div>
              {["", "pending", "active", "sold", "adopted", "removed"].map((s) => (
                <button
                  key={s}
                  onClick={() => setListingFilter(s)}
                  className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${listingFilter === s ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-white text-slate-500 border border-slate-200 hover:border-primary/30 hover:text-primary"}`}
                >
                  {s || "All"}
                </button>
              ))}
            </div>

            {listingsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />)}
              </div>
            ) : (
              <div className="glass-card bg-white border-slate-100 shadow-sm overflow-hidden">
                {listings.length === 0 ? (
                  <div className="text-center py-20 text-slate-400">
                    <ClipboardList size={40} className="mx-auto mb-4 opacity-30" />
                    <p className="font-bold">No listings found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 px-6 py-4">Listing</th>
                          <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 py-4">Owner</th>
                          <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 py-4">Type</th>
                          <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 py-4">Status</th>
                          <th className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400 px-6 py-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {listings.map((l) => (
                          <tr key={l._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                                  {l.images?.[0] ? (
                                    <img src={l.images[0]} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-xl">🐾</div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-black text-slate-900 text-sm max-w-[200px] truncate">{l.title}</p>
                                  <p className="text-xs text-slate-400 font-bold capitalize">{l.petType} · {l.breed}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <p className="font-bold text-sm text-slate-700">{l.owner?.name}</p>
                              <p className="text-xs text-slate-400">{l.owner?.email}</p>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-lg ${l.listingType === "sale" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
                                {l.listingType}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <StatusBadge status={l.status} />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <Link to={`/marketplace/${l._id}`} className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-primary/10 hover:text-primary transition-all" title="View listing">
                                  <Eye size={16} />
                                </Link>
                                {l.status === "pending" && (
                                  <>
                                    <button
                                      disabled={loadingId === l._id}
                                      onClick={() => handleApprove(l._id)}
                                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all text-xs font-black disabled:opacity-50"
                                    >
                                      {loadingId === l._id ? <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <CheckCircle size={14} />}
                                      Approve
                                    </button>
                                    <button
                                      disabled={loadingId === l._id}
                                      onClick={() => setRejectModal(l._id)}
                                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white transition-all text-xs font-black disabled:opacity-50"
                                    >
                                      <XCircle size={14} /> Reject
                                    </button>
                                  </>
                                )}
                                {l.status === "active" && (
                                  <button
                                    disabled={loadingId === l._id}
                                    onClick={() => handleRemove(l._id)}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-rose-600 hover:text-white transition-all text-xs font-black disabled:opacity-50"
                                  >
                                    <Trash2 size={14} /> Remove
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </Motion.div>
        )}

        {/* ── Users Tab ─────────────────────────────────────────────── */}
        {activeTab === "users" && (
          <Motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex gap-4 mb-8">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
                  className="pl-10 pr-4 py-3 w-72 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-primary/20 outline-none font-semibold text-sm"
                />
              </div>
              <button onClick={fetchUsers} className="p-3 bg-white border border-slate-200 rounded-xl text-primary hover:bg-primary/10 transition-all">
                <RefreshCw size={16} />
              </button>
            </div>

            {usersLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />)}
              </div>
            ) : (
              <div className="glass-card bg-white border-slate-100 shadow-sm overflow-hidden">
                {users.length === 0 ? (
                  <div className="text-center py-20 text-slate-400">
                    <Users size={40} className="mx-auto mb-4 opacity-30" />
                    <p className="font-bold">No users found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 px-6 py-4">User</th>
                          <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 py-4">Location</th>
                          <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 py-4">Joined</th>
                          <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 py-4">Status</th>
                          <th className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400 px-6 py-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {users.map((u) => (
                          <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center text-white font-black text-sm overflow-hidden shrink-0">
                                  {u.profileImage ? (
                                    <img src={u.profileImage} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    u.name?.[0]?.toUpperCase()
                                  )}
                                </div>
                                <div>
                                  <p className="font-black text-slate-900 text-sm">{u.name}</p>
                                  <p className="text-xs text-slate-400">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-600 font-semibold">{u.location || "—"}</td>
                            <td className="px-4 py-4 text-sm text-slate-500">
                              {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-lg ${u.isBlocked ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                                {u.isBlocked ? "Blocked" : "Active"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                disabled={loadingId === u._id}
                                onClick={() => handleBlockToggle(u)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ml-auto disabled:opacity-50 ${
                                  u.isBlocked
                                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                                    : "bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white"
                                }`}
                              >
                                {loadingId === u._id ? (
                                  <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                ) : u.isBlocked ? (
                                  <><ShieldCheck size={14} /> Unblock</>
                                ) : (
                                  <><ShieldOff size={14} /> Block</>
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
