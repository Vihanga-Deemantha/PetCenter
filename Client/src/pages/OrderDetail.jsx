import React, { useState, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ArrowLeft, Package, MapPin, CreditCard } from "lucide-react";
import { getOrderById, cancelOrder as cancelOrderApi } from "../api/order.api";
import { useAuth } from "../context/AuthContext";
import StatusTimeline from "../components/store/StatusTimeline";
import { formatPrice } from "../utils/priceFormatter";

const OrderDetail = () => {
  const { orderId } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.resolve().then(() => setLoading(true));
    getOrderById(orderId)
      .then((res) => setOrder(res.data.data.order))
      .catch(() => setError("Order not found"))
      .finally(() => setLoading(false));
  }, [orderId, user]);

  if (!user) return <Navigate to="/login" replace />;

  const handleCancelOrder = async () => {
    if (window.confirm("Are you sure you want to cancel this order? It will restore items to stock.")) {
      setCancelling(true);
      try {
        const res = await cancelOrderApi(orderId);
        setOrder(res.data.data.order);
      } catch (err) {
        alert(err.response?.data?.message || "Failed to cancel order");
      } finally {
        setCancelling(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-12 bg-slate-100 rounded-2xl w-48" />
        <div className="h-24 bg-slate-100 rounded-2xl" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-40 bg-slate-100 rounded-2xl" />
          <div className="h-40 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-24">
        <Package size={48} className="mx-auto mb-4 text-slate-300" />
        <h2 className="text-2xl font-black text-slate-900 mb-2">Order Not Found</h2>
        <Link to="/orders" className="btn btn-primary">View All Orders</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Back */}
      <Link to="/orders" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors mb-8">
        <ArrowLeft size={16} /> All Orders
      </Link>

      {/* Header */}
      <Motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Order Details</h1>
            <p className="text-xs font-mono text-slate-400 mt-1">#{order._id}</p>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <p className="text-3xl font-black text-primary">{formatPrice(order.totalAmount)}</p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {new Date(order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
            {(order.status === "processing" || order.status === "pending") && (
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="mt-2 px-4 py-2 text-xs font-black uppercase tracking-wider text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {cancelling ? (
                  <span className="animate-spin rounded-full h-3 w-3 border-2 border-rose-600 border-t-transparent inline-block" />
                ) : (
                  "Cancel Order"
                )}
              </button>
            )}
          </div>
        </div>
      </Motion.div>

      {/* Status Timeline */}
      <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card bg-white border-slate-100 shadow-sm p-6 mb-6">
        <h2 className="font-black text-slate-900 mb-5">Order Status</h2>
        <StatusTimeline status={order.status} />
      </Motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Shipping Address */}
        {order.shippingAddress && (
          <Motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card bg-white border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={16} className="text-primary" />
              <h2 className="font-black text-slate-900">Shipping Address</h2>
            </div>
            <div className="space-y-1 text-sm font-medium text-slate-600">
              <p className="font-black text-slate-900">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
              <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </Motion.div>
        )}

        {/* Payment Info */}
        <Motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card bg-white border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={16} className="text-primary" />
            <h2 className="font-black text-slate-900">Payment</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Status</span>
              <span className={`font-black capitalize ${order.paymentStatus === "paid" ? "text-emerald-600" : "text-amber-600"}`}>{order.paymentStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Method</span>
              <span className="font-bold text-slate-700">Stripe</span>
            </div>
            {order.paymentIntentId && (
              <div className="flex justify-between gap-2">
                <span className="text-slate-500 font-medium shrink-0">Reference</span>
                <span className="font-mono text-[10px] text-slate-400 truncate">{order.paymentIntentId}</span>
              </div>
            )}
          </div>
        </Motion.div>
      </div>

      {/* Items */}
      <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card bg-white border-slate-100 shadow-sm p-6">
        <h2 className="font-black text-slate-900 mb-5">
          Items ({order.items?.length})
        </h2>
        <div className="space-y-4">
          {order.items?.map((item, i) => (
            <div key={i} className="flex gap-4 items-center">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0">
                {item.image?.url ? (
                  <img src={item.image.url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={22} className="text-slate-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-900 text-sm">{item.name}</p>
                <p className="text-xs text-slate-400 font-medium">{formatPrice(item.priceAtPurchase)} × {item.quantity}</p>
              </div>
              <p className="font-black text-slate-900 shrink-0">{formatPrice(item.priceAtPurchase * item.quantity)}</p>
            </div>
          ))}

          {/* Total */}
          <div className="border-t border-slate-100 pt-4 flex justify-between">
            <span className="font-black text-slate-900">Total</span>
            <span className="font-black text-primary text-lg">{formatPrice(order.totalAmount)}</span>
          </div>
        </div>
      </Motion.div>
    </div>
  );
};

export default OrderDetail;
