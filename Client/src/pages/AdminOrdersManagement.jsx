import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion as Motion } from "framer-motion";
import { Search, RefreshCw, Package, Eye, ChevronDown, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { getAdminOrders, updateOrderStatus } from "../api/order.api";
import { formatPrice } from "../utils/priceFormatter";

const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled"];
const STATUS_COLORS = {
  processing: "bg-[#F7E9DF] text-[#8f4a28]",
  shipped: "bg-[#E4EAF2] text-[#31506f]",
  delivered: "bg-[#E9EDE4] text-[#40543C]",
  cancelled: "bg-rose-50 text-rose-700",
  pending: "bg-[#EFEBE2] text-[#6e6e64]",
};

const StatusSelect = ({ orderId, currentStatus, trackingNumber, carrier, onUpdate }) => {
  const [updating, setUpdating] = useState(false);
  // Set only while the "mark as shipped" tracking-info popover is open —
  // the status isn't applied until the admin confirms (or skips) it.
  const [pendingShip, setPendingShip] = useState(false);
  const [trackingInput, setTrackingInput] = useState("");
  const [carrierInput, setCarrierInput] = useState("");

  const applyStatus = async (newStatus, extra = {}) => {
    setUpdating(true);
    try {
      await updateOrderStatus(orderId, newStatus, extra);
      onUpdate(orderId, newStatus, extra);
    } catch (err) {
      // The server legitimately rejects some transitions (e.g. trying to
      // move a cancelled/refunded order anywhere else, or a failed Stripe
      // refund on cancel) — silently reverting the dropdown with no
      // explanation left the admin with no idea why nothing happened.
      alert(err.response?.data?.message || "Failed to update order status.");
    }
    setUpdating(false);
    setPendingShip(false);
  };

  const handleChange = (e) => {
    const newStatus = e.target.value;
    if (newStatus === currentStatus) return;
    if (newStatus === "shipped") {
      // Tracking info is optional but worth asking for right when it's
      // decided — not a separate step admins would have to remember later.
      setTrackingInput(trackingNumber || "");
      setCarrierInput(carrier || "");
      setPendingShip(true);
      return;
    }
    applyStatus(newStatus);
  };

  const confirmShipped = () => {
    const extra = {};
    if (trackingInput.trim()) extra.trackingNumber = trackingInput.trim();
    if (carrierInput.trim()) extra.carrier = carrierInput.trim();
    applyStatus("shipped", extra);
  };

  return (
    <div className="relative inline-block">
      {updating && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}
      <select
        value={currentStatus}
        onChange={handleChange}
        disabled={updating}
        className={`appearance-none pl-3 pr-8 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border-none cursor-pointer focus:outline-none ${STATUS_COLORS[currentStatus] || STATUS_COLORS.pending} ${updating ? "opacity-0" : ""}`}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s} className="bg-white text-[#292925] normal-case tracking-normal text-sm">{s}</option>
        ))}
      </select>
      <ChevronDown size={12} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${updating ? "opacity-0" : ""}`} />

      {(trackingNumber || carrier) && (
        <p className="mt-1.5 flex items-center gap-1 text-[10.5px] text-[#8a8a80] font-medium max-w-44 truncate" title={[carrier, trackingNumber].filter(Boolean).join(" · ")}>
          <Truck size={11} className="shrink-0" />
          <span className="truncate">{[carrier, trackingNumber].filter(Boolean).join(" · ")}</span>
        </p>
      )}

      {pendingShip && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setPendingShip(false)} />
          <div className="absolute left-0 top-full mt-2 z-40 w-64 bg-white border border-border rounded-2xl shadow-xl shadow-black/10 p-4 text-left normal-case">
            <p className="text-xs font-semibold text-[#292925] mb-3">Mark as shipped</p>
            <div className="flex flex-col gap-2.5">
              <input
                value={carrierInput}
                onChange={(e) => setCarrierInput(e.target.value)}
                placeholder="Carrier (optional)"
                className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none focus:border-accent"
              />
              <input
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                placeholder="Tracking number (optional)"
                className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none focus:border-accent"
              />
            </div>
            <div className="flex gap-2 mt-3.5">
              <button onClick={() => setPendingShip(false)} className="flex-1 py-2 rounded-lg bg-light text-[#4F5B4B] text-xs font-semibold">
                Cancel
              </button>
              <button onClick={confirmShipped} className="flex-1 py-2 rounded-lg bg-primary text-white text-xs font-semibold">
                Confirm
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const AdminOrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({});
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  // Guards against an older, slower request (e.g. from a filter the admin
  // has since changed) resolving after a newer one and overwriting the
  // table with stale/wrong-filter data.
  const requestSeq = useRef(0);

  const fetchOrders = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setFetchError(false);
    try {
      const params = { page, limit: 15, sortBy };
      if (statusFilter) params.status = statusFilter;
      const res = await getAdminOrders(params);
      if (seq !== requestSeq.current) return;
      setOrders(res.data.data.orders || []);
      setPagination(res.data.data.pagination || {});
      setStatistics(res.data.data.statistics || null);
    } catch {
      if (seq !== requestSeq.current) return;
      setOrders([]);
      setFetchError(true);
    }
    if (seq === requestSeq.current) setLoading(false);
  }, [page, statusFilter, sortBy]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusUpdate = (orderId, newStatus, extra = {}) => {
    setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, status: newStatus, ...extra } : o));
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-7 flex-wrap gap-4 pb-7 border-b border-border">
        <div>
          <p className="text-xs tracking-[0.18em] uppercase text-accent font-semibold mb-2.5">Admin</p>
          <h1 className="font-heading text-[32px] font-medium tracking-tight text-[#292925]">Orders</h1>
          <p className="text-[#6e6e64] mt-1">{pagination.totalItems || 0} orders total</p>
        </div>
        <button onClick={fetchOrders} className="p-2.75 bg-white border border-border rounded-xl text-primary hover:bg-primary/10 transition-all">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Stats Row */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
          {[
            { label: "Total revenue", value: formatPrice(statistics.totalRevenue), color: "text-primary" },
            { label: "Total orders", value: statistics.totalOrders, color: "text-[#292925]" },
            { label: "Processing", value: statistics.statusBreakdown?.find((s) => s._id === "processing")?.count || 0, color: "text-[#8f4a28]" },
            { label: "Shipped", value: statistics.statusBreakdown?.find((s) => s._id === "shipped")?.count || 0, color: "text-[#31506f]" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-border rounded-[22px] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8a8a80] mb-1.5">{stat.label}</p>
              <p className={`font-heading text-2xl font-medium ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-7 items-center">
        <div className="flex gap-2 flex-wrap">
          {["", ...STATUS_OPTIONS].map((s) => (
            <button key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`inline-flex items-center justify-center rounded-full px-4 py-2.25 text-[12.5px] font-medium border transition-colors capitalize ${
                statusFilter === s ? "bg-secondary text-light border-secondary" : "bg-white border-border text-secondary hover:bg-light"
              }`}>
              {s || "All"}
            </button>
          ))}
        </div>
        <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
          className="ml-auto px-4 py-2.25 rounded-xl border border-border bg-white font-medium text-sm text-[#3f3f38] outline-none focus:border-accent cursor-pointer">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="highest">Highest value</option>
          <option value="lowest">Lowest value</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <div key={i} className="h-20 bg-border rounded-2xl animate-pulse" />)}
        </div>
      ) : fetchError ? (
        <div className="text-center py-24">
          <Package size={44} className="mx-auto mb-4 text-[#c9c2b3]" />
          <p className="font-semibold text-[#292925]">Couldn't load orders. Please try again.</p>
          <button onClick={fetchOrders} className="mt-4 btn btn-primary">Retry</button>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-24">
          <Package size={44} className="mx-auto mb-4 text-[#c9c2b3]" />
          <p className="font-semibold text-[#292925]">No orders found</p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-[22px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Order ID", "Date", "Items", "Customer", "Status", "Total", "Actions"].map((h) => (
                    <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#8a8a80] px-5 py-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order, i) => (
                  <Motion.tr
                    key={order._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-light/60 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className="font-mono text-[11px] text-[#8a8a80] max-w-[120px] truncate">{order._id}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#5c5c54] font-medium whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {/* Thumbnails of first 2 products */}
                        <div className="flex -space-x-2">
                          {order.items?.slice(0, 2).map((item, j) => (
                            <div key={j} className="w-8 h-8 rounded-lg overflow-hidden border-2 border-white bg-light shrink-0">
                              {item.image?.url ? (
                                <img src={item.image.url} alt="" className="w-full h-full object-cover" />
                              ) : <div className="w-full h-full flex items-center justify-center text-[10px]">📦</div>}
                            </div>
                          ))}
                        </div>
                        <span className="text-sm font-medium text-[#3f3f38]">{order.items?.length} item{order.items?.length !== 1 ? "s" : ""}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-[#3f3f38]">
                        {order.shippingAddress?.fullName || "—"}
                      </p>
                      <p className="text-xs text-[#8a8a80]">{order.shippingAddress?.city}</p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusSelect
                        orderId={order._id}
                        currentStatus={order.status}
                        trackingNumber={order.trackingNumber}
                        carrier={order.carrier}
                        onUpdate={handleStatusUpdate}
                      />
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#292925] whitespace-nowrap">{formatPrice(order.totalAmount)}</td>
                    <td className="px-5 py-4">
                      <Link
                        to={`/orders/${order._id}`}
                        target="_blank"
                        className="p-2 rounded-xl bg-light text-[#6e6e64] hover:bg-primary/10 hover:text-primary transition-all inline-flex"
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
            <div className="flex items-center justify-center gap-2 p-5 border-t border-border">
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button key={i + 1} onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 rounded-full font-semibold text-xs transition-all ${page === i + 1 ? "bg-secondary text-light" : "border border-border text-secondary hover:bg-light"}`}>
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
