import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, ChevronRight, Clock, Truck, CheckCircle, XCircle } from "lucide-react";
import { getUserOrders } from "../../api/order.api";
import { formatPrice } from "../../utils/priceFormatter";

const STATUS_CONFIG = {
  processing: { color: "bg-[#F7E9DF] text-[#8f4a28]", icon: Clock },
  shipped: { color: "bg-[#E4EAF2] text-[#31506f]", icon: Truck },
  delivered: { color: "bg-[#E9EDE4] text-[#40543C]", icon: CheckCircle },
  cancelled: { color: "bg-rose-50 text-rose-700", icon: XCircle },
  pending: { color: "bg-[#EFEBE2] text-[#6e6e64]", icon: Clock },
};

const STATUS_FILTERS = ["", "processing", "shipped", "delivered", "cancelled"];

export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 10 };
    if (statusFilter) params.status = statusFilter;
    getUserOrders(params)
      .then((res) => {
        setOrders(res.data.data.orders || []);
        setPagination(res.data.data.pagination || {});
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  return (
    <div>
      <div className="mb-7">
        <p className="text-xs tracking-[0.18em] uppercase text-accent font-semibold mb-2.5">Dashboard</p>
        <h1 className="font-heading text-[30px] sm:text-[36px] font-medium tracking-tight text-[#292925]">Your orders</h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-7">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-2.25 text-[12.5px] font-medium border transition-colors capitalize ${
              statusFilter === s ? "bg-secondary text-light border-secondary" : "bg-white text-secondary border-border hover:bg-light"
            }`}
          >
            {s || "All orders"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-border rounded-2xl animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-dashed border-[#dcd4c6] rounded-[22px] py-14 px-8 text-center">
          <Package size={36} className="mx-auto mb-3.5 text-[#c9c2b3]" />
          <h3 className="font-heading text-xl font-medium mb-1.5">No orders yet</h3>
          <p className="text-[#6e6e64] text-sm mb-6">When you make a purchase, it'll appear here.</p>
          <Link to="/products" className="btn btn-primary">Browse the store</Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {orders.map((order) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
              return (
                <Link
                  key={order._id}
                  to={`/orders/${order._id}`}
                  className="bg-white border border-[#E8E2D8] rounded-2xl px-5 py-4 flex items-center gap-4 hover:border-[#cfc8ba] hover:shadow-sm transition-all"
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-light border border-[#E8E2D8] shrink-0">
                    {order.items?.[0]?.image?.url ? (
                      <img src={order.items[0].image.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={20} className="text-[#c9c2b3]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="m-0 text-sm font-semibold text-[#292925] truncate">
                      {order.items?.length} item{order.items?.length !== 1 ? "s" : ""}
                      {order.items?.length > 0 && ` · ${order.items[0].name}${order.items.length > 1 ? ` +${order.items.length - 1} more` : ""}`}
                    </p>
                    <p className="m-0 mt-0.5 text-[12px] text-[#8a8a80]">
                      {new Date(order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${cfg.color}`}>
                      <StatusIcon size={11} /> {order.status}
                    </span>
                    <p className="m-0 font-semibold text-[#292925]">{formatPrice(order.totalAmount)}</p>
                    <ChevronRight size={18} className="text-[#c9c2b3]" />
                  </div>
                </Link>
              );
            })}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2.5 mt-8">
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 rounded-full text-sm font-semibold transition-colors ${
                    page === i + 1 ? "bg-secondary text-light" : "border border-border bg-white text-secondary hover:bg-light"
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
}
