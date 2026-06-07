import React, { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { Package, ChevronRight, Clock, Truck, CheckCircle, XCircle } from "lucide-react";
import { getUserOrders } from "../api/order.api";
import { useAuth } from "../context/AuthContext";
import { formatPrice } from "../utils/priceFormatter";

const STATUS_CONFIG = {
  processing: { color: "bg-amber-50 text-amber-700", icon: Clock },
  shipped: { color: "bg-blue-50 text-blue-700", icon: Truck },
  delivered: { color: "bg-emerald-50 text-emerald-700", icon: CheckCircle },
  cancelled: { color: "bg-rose-50 text-rose-700", icon: XCircle },
  pending: { color: "bg-slate-100 text-slate-600", icon: Clock },
};

const OrderHistory = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.resolve().then(() => setLoading(true));
    const params = { page, limit: 10 };
    if (statusFilter) params.status = statusFilter;
    getUserOrders(params)
      .then((res) => {
        setOrders(res.data.data.orders || []);
        setPagination(res.data.data.pagination || {});
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [page, statusFilter, user]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div>
      <Motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900">
          My <span className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">Orders</span>
        </h1>
        <p className="text-slate-500 font-medium mt-1">Track and manage your purchases</p>
      </Motion.div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {["", "processing", "shipped", "delivered", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
              statusFilter === s ? "bg-primary text-white shadow-lg shadow-indigo-500/30" : "bg-white border border-slate-200 text-slate-500 hover:border-primary/30 hover:text-primary"
            }`}
          >
            {s || "All Orders"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
          <Package size={52} className="mx-auto mb-4 text-slate-300" />
          <h3 className="text-xl font-black text-slate-900 mb-2">No orders yet</h3>
          <p className="text-slate-500 font-medium mb-6">When you make a purchase, it'll appear here.</p>
          <Link to="/products" className="btn btn-primary">Browse Products</Link>
        </Motion.div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order, i) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
              return (
                <Motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={`/orders/${order._id}`} className="block glass-card bg-white border-slate-100 shadow-sm p-5 hover:shadow-xl hover:border-indigo-100 transition-all group">
                    <div className="flex items-center gap-4">
                      {/* First product image */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0">
                        {order.items?.[0]?.image?.url ? (
                          <img src={order.items[0].image.url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={24} className="text-slate-300" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <p className="font-black text-slate-900 text-sm">
                              {order.items?.length} item{order.items?.length !== 1 ? "s" : ""}
                              {order.items?.length > 0 && ` · ${order.items[0].name}${order.items.length > 1 ? ` +${order.items.length - 1} more` : ""}`}
                            </p>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                              {new Date(order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider ${cfg.color}`}>
                              <StatusIcon size={11} /> {order.status}
                            </span>
                            <p className="font-black text-slate-900">{formatPrice(order.totalAmount)}</p>
                            <ChevronRight size={18} className="text-slate-400 group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </Motion.div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`w-10 h-10 rounded-xl font-black text-sm transition-all ${
                    page === i + 1 ? "bg-primary text-white shadow-lg" : "border border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrderHistory;
