import React, { useState, useEffect, useCallback } from "react";
import { motion as Motion } from "framer-motion";
import { Search, RefreshCw, Package, AlertCircle, Eye, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { getAdminOrders, updateOrderStatus } from "../api/order.api";
import { formatPrice } from "../utils/priceFormatter";

const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled"];
const STATUS_COLORS = {
  processing: "bg-amber-50 text-amber-700 border-amber-100",
  shipped: "bg-blue-50 text-blue-700 border-blue-100",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-100",
  cancelled: "bg-rose-50 text-rose-700 border-rose-100",
  pending: "bg-slate-100 text-slate-600 border-slate-200",
};

const StatusSelect = ({ orderId, currentStatus, onUpdate }) => {
  const [updating, setUpdating] = useState(false);
  const handleChange = async (e) => {
    const newStatus = e.target.value;
    if (newStatus === currentStatus) return;
    setUpdating(true);
    try {
      await updateOrderStatus(orderId, newStatus);
      onUpdate(orderId, newStatus);
    } catch { /* ignore */ }
    setUpdating(false);
  };

  return (
    <div className="relative inline-block">
      {updating && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}
      <select
        value={currentStatus}
        onChange={handleChange}
        disabled={updating}
        className={`appearance-none pl-3 pr-8 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 ${STATUS_COLORS[currentStatus] || STATUS_COLORS.pending} ${updating ? "opacity-0" : ""}`}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s} className="bg-white text-slate-800 normal-case tracking-normal text-sm">{s}</option>
        ))}
      </select>
      <ChevronDown size={12} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${updating ? "opacity-0" : ""}`} />
    </div>
  );
};

const AdminOrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({});
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, sortBy };
      if (statusFilter) params.status = statusFilter;
      const res = await getAdminOrders(params);
      setOrders(res.data.data.orders || []);
      setPagination(res.data.data.pagination || {});
      setStatistics(res.data.data.statistics || null);
    } catch { setOrders([]); }
    setLoading(false);
  }, [page, statusFilter, sortBy]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusUpdate = (orderId, newStatus) => {
    setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, status: newStatus } : o));
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Orders</h1>
          <p className="text-slate-500 font-medium">{pagination.totalItems || 0} orders total</p>
        </div>
        <button onClick={fetchOrders} className="p-3 bg-white border border-slate-200 rounded-xl text-primary hover:bg-primary/10 transition-all">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Stats Row */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Revenue", value: formatPrice(statistics.totalRevenue), color: "text-primary" },
            { label: "Total Orders", value: statistics.totalOrders, color: "text-slate-900" },
            { label: "Processing", value: statistics.statusBreakdown?.find((s) => s._id === "processing")?.count || 0, color: "text-amber-600" },
            { label: "Shipped", value: statistics.statusBreakdown?.find((s) => s._id === "shipped")?.count || 0, color: "text-blue-600" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card bg-white border-slate-100 shadow-sm p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8 items-center">
        <div className="flex gap-2 flex-wrap">
          {["", ...STATUS_OPTIONS].map((s) => (
            <button key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                statusFilter === s ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-white border border-slate-200 text-slate-500 hover:border-primary/30 hover:text-primary"
              }`}>
              {s || "All"}
            </button>
          ))}
        </div>
        <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
          className="ml-auto px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold text-sm text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Value</option>
          <option value="lowest">Lowest Value</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-24">
          <Package size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="font-black text-slate-900">No orders found</p>
        </div>
      ) : (
        <div className="glass-card bg-white border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Order ID", "Date", "Items", "Customer", "Status", "Total", "Actions"].map((h) => (
                    <th key={h} className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 px-5 py-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map((order, i) => (
                  <Motion.tr
                    key={order._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className="font-mono text-[11px] text-slate-500 max-w-[120px] truncate">{order._id}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 font-medium whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {/* Thumbnails of first 2 products */}
                        <div className="flex -space-x-2">
                          {order.items?.slice(0, 2).map((item, j) => (
                            <div key={j} className="w-8 h-8 rounded-lg overflow-hidden border-2 border-white bg-slate-100 shrink-0">
                              {item.image?.url ? (
                                <img src={item.image.url} alt="" className="w-full h-full object-cover" />
                              ) : <div className="w-full h-full flex items-center justify-center text-[10px]">📦</div>}
                            </div>
                          ))}
                        </div>
                        <span className="text-sm font-bold text-slate-700">{order.items?.length} item{order.items?.length !== 1 ? "s" : ""}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-slate-700">
                        {order.shippingAddress?.fullName || "—"}
                      </p>
                      <p className="text-xs text-slate-400">{order.shippingAddress?.city}</p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusSelect orderId={order._id} currentStatus={order.status} onUpdate={handleStatusUpdate} />
                    </td>
                    <td className="px-5 py-4 font-black text-slate-900 whitespace-nowrap">{formatPrice(order.totalAmount)}</td>
                    <td className="px-5 py-4">
                      <Link
                        to={`/orders/${order._id}`}
                        target="_blank"
                        className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-primary/10 hover:text-primary transition-all inline-flex"
                        title="View order"
                      >
                        <Eye size={15} />
                      </Link>
                    </td>
                  </Motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-5 border-t border-slate-100">
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button key={i + 1} onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 rounded-xl font-black text-xs transition-all ${page === i + 1 ? "bg-primary text-white shadow-lg" : "border border-slate-200 text-slate-500 hover:border-primary hover:text-primary"}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminOrdersManagement;
