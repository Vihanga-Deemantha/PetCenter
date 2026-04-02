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
  RefreshCw, Eye, AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";


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

  const statCards = stats ? [
    { label: "Total Users", value: stats.users.total, sub: `${stats.users.blocked} blocked`, icon: <Users size={24} />, color: "bg-indigo-50 text-indigo-600 border-indigo-100", onClick: () => setActiveTab("users") },
    { label: "Active Listings", value: stats.listings.active, sub: `${stats.listings.pending} pending`, icon: <ClipboardList size={24} />, color: "bg-emerald-50 text-emerald-600 border-emerald-100", onClick: () => { setActiveTab("listings"); setListingFilter("active"); } },
    { label: "Pending Review", value: stats.listings.pending, sub: "Need approval", icon: <Clock size={24} />, color: "bg-amber-50 text-amber-600 border-amber-100", onClick: () => { setActiveTab("listings"); setListingFilter("pending"); } },
    { label: "Total Listings", value: stats.listings.total, sub: `${stats.listings.sold + stats.listings.adopted} closed`, icon: <Activity size={24} />, color: "bg-rose-50 text-rose-600 border-rose-100", onClick: () => { setActiveTab("listings"); setListingFilter(""); } },
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
        <button onClick={fetchStats} className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-indigo-50 hover:text-primary transition-all" title="Refresh stats">
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

      {/* Tabs removed in favor of AdminLayout Sidebar */}

      <AnimatePresence mode="wait">
        {/* ── Overview Tab ─────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <Motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {statsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="glass-card p-8 h-36 animate-pulse bg-slate-100" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {statCards.map((stat, i) => (
                  <Motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={stat.onClick}
                    className="glass-card p-8 bg-white border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                        <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                        <p className="text-xs text-slate-400 font-bold mt-1">{stat.sub}</p>
                      </div>
                      <div className={`p-4 rounded-[20px] border shadow-sm ${stat.color}`}>
                        {stat.icon}
                      </div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity">Click to manage →</p>
                  </Motion.div>
                ))}
              </div>
            )}

            {/* Listing Status Breakdown */}
            {stats && (
              <div className="glass-card mt-10 p-8 bg-white border-slate-100 shadow-sm">
                <h2 className="text-xl font-black text-slate-900 mb-6">Listings Breakdown</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(stats.listings).filter(([k]) => k !== "total").map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => { setActiveTab("listings"); setListingFilter(k); }}
                      className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary/30 hover:bg-indigo-50/30 transition-all group"
                    >
                      <p className="text-3xl font-black text-slate-900 group-hover:text-primary transition-colors">{v}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{k}</p>
                    </button>
                  ))}
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
                  className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${listingFilter === s ? "bg-primary text-white shadow-lg shadow-indigo-500/30" : "bg-white text-slate-500 border border-slate-200 hover:border-primary/30 hover:text-primary"}`}
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
                                <Link to={`/marketplace/${l._id}`} className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-primary transition-all" title="View listing">
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
              <button onClick={fetchUsers} className="p-3 bg-white border border-slate-200 rounded-xl text-primary hover:bg-indigo-50 transition-all">
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
