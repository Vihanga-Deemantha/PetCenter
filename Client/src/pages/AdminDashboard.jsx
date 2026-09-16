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
  Activity, Users, ClipboardList, CheckCircle,
  XCircle, Trash2, ShieldOff, ShieldCheck, Search,
  RefreshCw, Eye, AlertCircle, ShoppingBag, Heart, DollarSign,
  TrendingUp, TrendingDown, Calendar, AlertTriangle,
  Sparkles, Flame, Gift
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
    active: "bg-[#E9EDE4] text-[#40543C]",
    pending: "bg-[#F7E9DF] text-[#8f4a28]",
    sold: "bg-[#EFEBE2] text-[#6e6e64]",
    adopted: "bg-[#E4EAF2] text-[#31506f]",
    removed: "bg-rose-50 text-rose-700",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest ${map[status] || "bg-[#EFEBE2] text-[#6e6e64]"}`}>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#292925]/40 backdrop-blur-sm p-4">
      <Motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-[26px] shadow-2xl max-w-md w-full p-8 border border-border"
      >
        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <XCircle size={24} className="text-rose-500" />
        </div>
        <h2 className="font-heading text-2xl font-medium text-[#292925] mb-2 text-center">Reject listing</h2>
        <p className="text-[#6e6e64] text-center text-sm mb-6">
          Provide a reason for rejection. This helps the owner understand what to improve.
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full px-4.5 py-3.5 rounded-xl bg-light border border-border focus:border-accent outline-none resize-none h-24 text-sm mb-6"
          placeholder="Rejection reason..."
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 bg-light text-secondary font-medium rounded-full hover:bg-border transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="flex-1 py-3.5 bg-rose-500 text-white font-medium rounded-full hover:bg-rose-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <div className="w-4.5 h-4.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <><XCircle size={16} /> Reject</>
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
    if (value === 0) return <span className="text-[#a8a49a] text-xs font-medium">0% WoW</span>;
    const isPositive = value > 0;
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${isPositive ? "text-[#40543C]" : "text-rose-500"}`}>
        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {isPositive ? "+" : ""}{value}% WoW
      </span>
    );
  };

  const statCards = stats?.cards ? [
    { label: "Total Users", value: stats.cards.users.total, trend: stats.cards.users.trend, icon: <Users size={20} />, color: "bg-primary/10 text-primary border-primary/20", onClick: () => setActiveTab("users") },
    { label: "Pet Listings", value: stats.cards.listings.total, trend: stats.cards.listings.trend, icon: <ClipboardList size={20} />, color: "bg-[#E9EDE4] text-[#40543C] border-[#d9e2d0]", onClick: () => setActiveTab("listings") },
    { label: "Store Products", value: stats.cards.products.total, trend: stats.cards.products.trend, icon: <ShoppingBag size={20} />, color: "bg-[#F7E9DF] text-[#8f4a28] border-[#f0d9c5]", onClick: null },
    { label: "Orders Count", value: stats.cards.orders.total, trend: stats.cards.orders.trend, icon: <Activity size={20} />, color: "bg-rose-50 text-rose-600 border-rose-100", onClick: null },
    { label: "Store Revenue", value: `$${stats.cards.revenue.totalInDollars}`, trend: stats.cards.revenue.trend, icon: <DollarSign size={20} />, color: "bg-primary/10 text-primary border-primary/20", onClick: null },
    { label: "Active Campaigns", value: stats.cards.campaigns.total, trend: stats.cards.campaigns.trend, icon: <Flame size={20} />, color: "bg-rose-50 text-rose-600 border-rose-100", onClick: null },
    { label: "Donation Count", value: stats.cards.donations.total, trend: stats.cards.donations.trend, icon: <Heart size={20} />, color: "bg-[#E4EAF2] text-[#31506f] border-[#d3ddea]", onClick: null },
    { label: "Donation Revenue", value: `$${stats.cards.donationRevenue.totalInDollars}`, trend: stats.cards.donationRevenue.trend, icon: <Gift size={20} />, color: "bg-[#E9EDE4] text-[#40543C] border-[#d9e2d0]", onClick: null },
  ] : [];

  const chartLegendFont = { family: "Inter", weight: "600", size: 10 };

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
      <div className="mb-9 pb-7 border-b border-border flex items-start justify-between">
        <div>
          <p className="text-xs tracking-[0.18em] uppercase text-accent font-semibold mb-2.5">Admin</p>
          <h1 className="font-heading text-[32px] sm:text-[38px] font-medium tracking-tight text-[#292925] mb-1.5">Control center</h1>
          <p className="text-[#6e6e64] text-[15px]">
            Welcome, <span className="text-primary font-semibold">{user?.name}</span>
          </p>
        </div>
        <button onClick={fetchStats} className="p-3 bg-white border border-border text-secondary rounded-xl hover:bg-light transition-all cursor-pointer" title="Refresh stats">
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
            className="flex items-center gap-3 p-4 bg-[#F7E9DF] text-[#8f4a28] rounded-xl mb-8 text-sm font-medium"
          >
            <AlertCircle size={18} /> {actionError}
            <button onClick={() => setActionError("")} className="ml-auto text-[#8f4a28]/60 hover:text-[#8f4a28]">✕</button>
          </Motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* ── Overview Tab ─────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <Motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-9">
            {statsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="rounded-[22px] p-6 h-32 animate-pulse bg-border" />
                ))}
              </div>
            ) : (
              /* Stat Cards Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {statCards.map((stat, i) => (
                  <Motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={stat.onClick || undefined}
                    className={`bg-white border border-border rounded-[22px] p-5.5 hover:border-[#cfc8ba] transition-all ${stat.onClick ? "cursor-pointer" : ""}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10.5px] font-semibold uppercase tracking-widest text-[#8a8a80] mb-1.5">{stat.label}</p>
                        <h3 className="font-heading text-2xl font-medium text-[#292925]">{stat.value}</h3>
                        <div className="mt-2">
                          <Trend value={stat.trend} />
                        </div>
                      </div>
                      <div className={`p-2.75 rounded-xl border ${stat.color}`}>
                        {stat.icon}
                      </div>
                    </div>
                  </Motion.div>
                ))}
              </div>
            )}

            {/* Interactive Charts Section */}
            {stats?.charts && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Platform Growth Chart */}
                <div className="bg-white border border-border rounded-[22px] p-6">
                  <h3 className="font-heading text-lg font-medium text-[#292925] mb-4 flex items-center gap-1.5">
                    <Sparkles size={16} className="text-primary" /> Platform interactions (30 days)
                  </h3>
                  <div className="h-64">
                    <Line
                      data={{
                        labels: stats.charts.labels,
                        datasets: [
                          { label: "New Signups", data: stats.charts.users, borderColor: "#78866F", backgroundColor: "rgba(120, 134, 111, 0.06)", fill: true, tension: 0.3, borderWidth: 2.5 },
                          { label: "Store Orders", data: stats.charts.orders, borderColor: "#C87550", backgroundColor: "rgba(200, 117, 80, 0.06)", fill: true, tension: 0.3, borderWidth: 2.5 },
                          { label: "Campaign Donations", data: stats.charts.donations, borderColor: "#4F5B4B", backgroundColor: "rgba(79, 91, 75, 0.06)", fill: true, tension: 0.3, borderWidth: 2.5 }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { labels: { font: chartLegendFont, color: "#5c5c54" } } },
                        scales: { x: { grid: { display: false }, ticks: { color: "#8a8a80" } }, y: { ticks: { stepSize: 1, color: "#8a8a80" }, grid: { color: "#F0ECE3" } } }
                      }}
                    />
                  </div>
                </div>

                {/* Earnings Revenue Lines */}
                <div className="bg-white border border-border rounded-[22px] p-6">
                  <h3 className="font-heading text-lg font-medium text-[#292925] mb-4 flex items-center gap-1.5">
                    <DollarSign size={16} className="text-secondary" /> Daily revenue ($ USD)
                  </h3>
                  <div className="h-64">
                    <Line
                      data={{
                        labels: stats.charts.labels,
                        datasets: [
                          { label: "Store Earnings", data: stats.charts.orderRevenue, borderColor: "#C87550", backgroundColor: "rgba(200, 117, 80, 0.06)", fill: true, tension: 0.3, borderWidth: 2.5 },
                          { label: "Donation Contributions", data: stats.charts.donationRevenue, borderColor: "#4F5B4B", backgroundColor: "rgba(79, 91, 75, 0.06)", fill: true, tension: 0.3, borderWidth: 2.5 }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { labels: { font: chartLegendFont, color: "#5c5c54" } } },
                        scales: { x: { grid: { display: false }, ticks: { color: "#8a8a80" } }, y: { ticks: { color: "#8a8a80" }, grid: { color: "#F0ECE3" } } }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bestsellers and Stock Alerts */}
            {stats?.productStats && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bestsellers Table (ColSpan 2) */}
                <div className="bg-white border border-border rounded-[22px] p-6 lg:col-span-2">
                  <h3 className="font-heading text-lg font-medium text-[#292925] mb-4">Top 5 bestselling products</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-[#5c5c54]">
                      <thead>
                        <tr className="border-b border-border text-[10px] font-semibold uppercase tracking-wider text-[#8a8a80]">
                          <th className="pb-3">Product</th>
                          <th className="pb-3">Category</th>
                          <th className="pb-3">Price</th>
                          <th className="pb-3 text-right">Units sold</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {stats.productStats.topSelling.map((p) => (
                          <tr key={p._id}>
                            <td className="py-3 font-semibold text-[#292925]">{p.name}</td>
                            <td className="py-3 capitalize text-xs">{p.category}</td>
                            <td className="py-3">${p.priceInDollars}</td>
                            <td className="py-3 text-right font-semibold text-primary">{p.soldCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Stock Alerts (ColSpan 1) */}
                <div className="bg-white border border-border rounded-[22px] p-6 space-y-4">
                  <h3 className="font-heading text-lg font-medium text-[#292925] flex items-center gap-1.5">
                    <AlertTriangle size={17} className="text-[#8f4a28]" /> Stock status
                  </h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-rose-50 rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="font-heading text-2xl font-medium text-rose-700">{stats.productStats.outOfStock}</div>
                        <div className="text-[10px] text-rose-500 font-semibold uppercase tracking-wider">Out of stock items</div>
                      </div>
                      <XCircle size={26} className="text-rose-400" />
                    </div>
                    <div className="p-4 bg-[#F7E9DF] rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="font-heading text-2xl font-medium text-[#8f4a28]">{stats.productStats.lowStock}</div>
                        <div className="text-[10px] text-[#8f4a28] font-semibold uppercase tracking-wider">Low stock items (1-5)</div>
                      </div>
                      <AlertTriangle size={26} className="text-[#c9905e]" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Unified Chronological Activity Feed */}
            {stats?.timeline && (
              <div className="bg-white border border-border rounded-[22px] p-6">
                <h3 className="font-heading text-lg font-medium text-[#292925] mb-6 flex items-center gap-2">
                  <Activity className="text-primary" size={17} /> Live platform timeline
                </h3>
                <div className="relative border-l border-border pl-6 ml-3 space-y-6">
                  {stats.timeline.map((act) => {
                    // Type styling map
                    const typeMap = {
                      user_signup: { bg: "bg-primary/10 text-primary border-primary/20", icon: <Users size={13} /> },
                      product_order: { bg: "bg-[#E9EDE4] text-[#40543C] border-[#d9e2d0]", icon: <ShoppingBag size={13} /> },
                      campaign_donation: { bg: "bg-rose-50 text-rose-600 border-rose-100", icon: <Heart size={13} /> }
                    };
                    const meta = typeMap[act.type] || { bg: "bg-[#EFEBE2] text-[#6e6e64] border-border", icon: <Activity size={13} /> };

                    return (
                      <div key={act.id} className="relative">
                        {/* Bullet Circle Icon */}
                        <div className={`absolute -left-[37px] top-0.5 p-2 rounded-full border bg-white ${meta.bg}`}>
                          {meta.icon}
                        </div>
                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                            <h4 className="text-sm font-semibold text-[#292925]">{act.title}</h4>
                            <span className="text-[10px] text-[#8a8a80] font-medium flex items-center gap-1">
                              <Calendar size={10} /> {new Date(act.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-[#6e6e64] text-xs">{act.description}</p>
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
            <div className="flex flex-wrap gap-3 mb-7 items-center">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                <input
                  type="text"
                  placeholder="Search listings..."
                  value={listingSearch}
                  onChange={(e) => setListingSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchListings()}
                  className="pl-10 pr-4 py-2.75 rounded-xl bg-white border border-border focus:border-accent outline-none text-sm"
                />
              </div>
              {["", "pending", "active", "sold", "adopted", "removed"].map((s) => (
                <button
                  key={s}
                  onClick={() => setListingFilter(s)}
                  className={`inline-flex items-center justify-center rounded-full px-4 py-2.25 text-[12.5px] font-medium border transition-colors capitalize ${listingFilter === s ? "bg-secondary text-light border-secondary" : "bg-white text-secondary border-border hover:bg-light"}`}
                >
                  {s || "All"}
                </button>
              ))}
            </div>

            {listingsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-border animate-pulse" />)}
              </div>
            ) : (
              <div className="bg-white border border-border rounded-[22px] overflow-hidden">
                {listings.length === 0 ? (
                  <div className="text-center py-20 text-[#a8a49a]">
                    <ClipboardList size={36} className="mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No listings found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#8a8a80] px-6 py-4">Listing</th>
                          <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#8a8a80] px-4 py-4">Owner</th>
                          <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#8a8a80] px-4 py-4">Type</th>
                          <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#8a8a80] px-4 py-4">Status</th>
                          <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#8a8a80] px-6 py-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {listings.map((l) => (
                          <tr key={l._id} className="hover:bg-light/60 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-xl overflow-hidden bg-light shrink-0">
                                  {l.images?.[0] ? (
                                    <img src={l.images[0]} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[#c9c2b3] text-xl">🐾</div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-[#292925] text-sm max-w-[200px] truncate">{l.title}</p>
                                  <p className="text-xs text-[#8a8a80] capitalize">{l.petType} · {l.breed}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <p className="font-medium text-sm text-[#3f3f38]">{l.owner?.name}</p>
                              <p className="text-xs text-[#8a8a80]">{l.owner?.email}</p>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`text-[11px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-lg ${l.listingType === "sale" ? "bg-[#E9EDE4] text-[#40543C]" : "bg-[#E4EAF2] text-[#31506f]"}`}>
                                {l.listingType}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <StatusBadge status={l.status} />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <Link to={`/marketplace/${l._id}`} className="p-2 rounded-xl bg-light text-[#6e6e64] hover:bg-primary/10 hover:text-primary transition-all" title="View listing">
                                  <Eye size={15} />
                                </Link>
                                {l.status === "pending" && (
                                  <>
                                    <button
                                      disabled={loadingId === l._id}
                                      onClick={() => handleApprove(l._id)}
                                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E9EDE4] text-[#40543C] hover:bg-secondary hover:text-white transition-all text-xs font-semibold disabled:opacity-50"
                                    >
                                      {loadingId === l._id ? <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <CheckCircle size={13} />}
                                      Approve
                                    </button>
                                    <button
                                      disabled={loadingId === l._id}
                                      onClick={() => setRejectModal(l._id)}
                                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white transition-all text-xs font-semibold disabled:opacity-50"
                                    >
                                      <XCircle size={13} /> Reject
                                    </button>
                                  </>
                                )}
                                {l.status === "active" && (
                                  <button
                                    disabled={loadingId === l._id}
                                    onClick={() => handleRemove(l._id)}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-light text-[#6e6e64] hover:bg-rose-600 hover:text-white transition-all text-xs font-semibold disabled:opacity-50"
                                  >
                                    <Trash2 size={13} /> Remove
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
            <div className="flex gap-3 mb-7">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
                  className="pl-10 pr-4 py-2.75 w-72 rounded-xl bg-white border border-border focus:border-accent outline-none text-sm"
                />
              </div>
              <button onClick={fetchUsers} className="p-2.75 bg-white border border-border rounded-xl text-primary hover:bg-primary/10 transition-all">
                <RefreshCw size={16} />
              </button>
            </div>

            {usersLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-border animate-pulse" />)}
              </div>
            ) : (
              <div className="bg-white border border-border rounded-[22px] overflow-hidden">
                {users.length === 0 ? (
                  <div className="text-center py-20 text-[#a8a49a]">
                    <Users size={36} className="mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No users found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#8a8a80] px-6 py-4">User</th>
                          <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#8a8a80] px-4 py-4">Location</th>
                          <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#8a8a80] px-4 py-4">Joined</th>
                          <th className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#8a8a80] px-4 py-4">Status</th>
                          <th className="text-right text-[10px] font-semibold uppercase tracking-widest text-[#8a8a80] px-6 py-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {users.map((u) => (
                          <tr key={u._id} className="hover:bg-light/60 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-sm overflow-hidden shrink-0">
                                  {u.profileImage ? (
                                    <img src={u.profileImage} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    u.name?.[0]?.toUpperCase()
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-[#292925] text-sm">{u.name}</p>
                                  <p className="text-xs text-[#8a8a80]">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-[#5c5c54] font-medium">{u.location || "—"}</td>
                            <td className="px-4 py-4 text-sm text-[#6e6e64]">
                              {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`text-[11px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-lg ${u.isBlocked ? "bg-rose-50 text-rose-700" : "bg-[#E9EDE4] text-[#40543C]"}`}>
                                {u.isBlocked ? "Blocked" : "Active"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                disabled={loadingId === u._id}
                                onClick={() => handleBlockToggle(u)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ml-auto disabled:opacity-50 ${
                                  u.isBlocked
                                    ? "bg-[#E9EDE4] text-[#40543C] hover:bg-secondary hover:text-white"
                                    : "bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white"
                                }`}
                              >
                                {loadingId === u._id ? (
                                  <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                ) : u.isBlocked ? (
                                  <><ShieldCheck size={13} /> Unblock</>
                                ) : (
                                  <><ShieldOff size={13} /> Block</>
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
