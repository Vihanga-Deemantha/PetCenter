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
    setLoading(true);
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
      <div className="max-w-4xl mx-auto px-7 pt-8 pb-24">
        <div className="animate-pulse space-y-5">
          <div className="h-10 bg-border rounded-2xl w-48" />
          <div className="h-24 bg-border rounded-2xl" />
          <div className="grid grid-cols-2 gap-5">
            <div className="h-36 bg-border rounded-2xl" />
            <div className="h-36 bg-border rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-7 pt-8 pb-24 text-center">
        <Package size={40} className="mx-auto mb-4 text-[#c9c2b3]" />
        <h2 className="font-heading text-2xl mb-4">Order not found</h2>
        <Link to="/dashboard?tab=orders" className="btn btn-primary">View all orders</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-7 pt-8 pb-24">
      <Link to="/dashboard?tab=orders" className="inline-flex items-center gap-1.5 text-secondary text-sm font-medium mb-5">
        <ArrowLeft size={15} /> All orders
      </Link>

      <Motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-heading text-[28px] sm:text-[32px] font-medium tracking-tight text-[#292925]">Order details</h1>
            <p className="text-xs font-mono text-[#a8a49a] mt-1">#{order._id}</p>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <p className="m-0 font-heading text-[28px] font-medium text-primary">{formatPrice(order.totalAmount)}</p>
            <p className="m-0 text-xs text-[#8a8a80] font-medium">
              {new Date(order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
            {(order.status === "processing" || order.status === "pending") && (
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="mt-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-full transition-all disabled:opacity-50"
              >
                {cancelling ? "Cancelling…" : "Cancel order"}
              </button>
            )}
          </div>
        </div>
      </Motion.div>

      <div className="bg-white border border-[#E8E2D8] rounded-[22px] p-6 mb-6">
        <h2 className="m-0 mb-5 font-heading text-lg font-medium text-[#292925]">Order status</h2>
        <StatusTimeline status={order.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {order.shippingAddress && (
          <div className="bg-white border border-[#E8E2D8] rounded-[22px] p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={16} className="text-primary" />
              <h2 className="m-0 font-heading text-[15px] font-medium text-[#292925]">Shipping address</h2>
            </div>
            <div className="space-y-1 text-sm text-[#5c5c54]">
              <p className="m-0 font-semibold text-[#292925]">{order.shippingAddress.fullName}</p>
              <p className="m-0">{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && <p className="m-0">{order.shippingAddress.addressLine2}</p>}
              <p className="m-0">{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
              <p className="m-0">{order.shippingAddress.country}</p>
            </div>
          </div>
        )}

        <div className="bg-white border border-[#E8E2D8] rounded-[22px] p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={16} className="text-primary" />
            <h2 className="m-0 font-heading text-[15px] font-medium text-[#292925]">Payment</h2>
          </div>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-[#8a8a80] font-medium">Status</span>
              <span className={`font-semibold capitalize ${order.paymentStatus === "paid" ? "text-[#40543C]" : "text-[#8f4a28]"}`}>{order.paymentStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8a8a80] font-medium">Method</span>
              <span className="font-semibold text-[#292925]">Stripe</span>
            </div>
            {order.paymentIntentId && (
              <div className="flex justify-between gap-2">
                <span className="text-[#8a8a80] font-medium shrink-0">Reference</span>
                <span className="font-mono text-[10px] text-[#a8a49a] truncate">{order.paymentIntentId}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#E8E2D8] rounded-[22px] p-6">
        <h2 className="m-0 mb-5 font-heading text-lg font-medium text-[#292925]">Items ({order.items?.length})</h2>
        <div className="space-y-4">
          {order.items?.map((item, i) => (
            <div key={i} className="flex gap-3.5 items-center">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-light border border-border shrink-0">
                {item.image?.url ? (
                  <img src={item.image.url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Package size={20} className="text-[#c9c2b3]" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="m-0 text-sm font-semibold text-[#292925]">{item.name}</p>
                <p className="m-0 text-xs text-[#8a8a80]">{formatPrice(item.priceAtPurchase)} × {item.quantity}</p>
              </div>
              <p className="m-0 font-semibold text-[#292925] shrink-0">{formatPrice(item.priceAtPurchase * item.quantity)}</p>
            </div>
          ))}

          <div className="border-t border-border pt-4 flex justify-between">
            <span className="font-semibold text-[#292925]">Total</span>
            <span className="font-heading text-lg font-medium text-primary">{formatPrice(order.totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
