import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  ChevronRight,
  Clock,
  Package,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";
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
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const params = { page, limit: 10 };
    if (statusFilter) params.status = statusFilter;

    getUserOrders(params)
      .then((res) => {
        if (cancelled) return;
        setOrders(res.data.data.orders || []);
        setPagination(res.data.data.pagination || {});
      })
      .catch((err) => {
        if (cancelled) return;
        setOrders([]);
        setPagination({});
        setError(
          err.response?.data?.message ||
            "We couldn't load your orders. Please try again."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, statusFilter, refreshKey]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            Your account
          </p>
          <h1 className="font-heading text-[34px] font-medium leading-[1.05] tracking-[-0.025em] text-[#292925] sm:text-[42px]">
            Your orders
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#6e6e64] sm:text-[15px]">
            Review purchases, delivery progress, and your complete order history.
          </p>
        </div>

        {!loading && !error && (
          <div className="flex w-fit items-baseline gap-2 rounded-xl border border-[#E8E2D8] bg-white px-4 py-2.5 shadow-[0_4px_16px_rgba(72,65,52,0.035)]">
            <span className="font-heading text-2xl font-medium text-[#292925]">
              {pagination.totalItems || 0}
            </span>
            <span className="text-xs font-medium text-[#8a8a80]">
              total {pagination.totalItems === 1 ? "order" : "orders"}
            </span>
          </div>
        )}
      </div>

      <div className="mb-7 flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-[#E8E2D8] bg-white/80 p-2 shadow-[0_5px_20px_rgba(72,65,52,0.03)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STATUS_FILTERS.map((status) => {
          const selected = statusFilter === status;
          return (
            <button
              key={status}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`min-h-10 whitespace-nowrap rounded-xl px-4 text-[12.5px] font-medium capitalize transition-all ${
                selected
                  ? "bg-secondary text-light shadow-[0_5px_14px_rgba(64,84,60,0.18)]"
                  : "text-secondary hover:bg-light"
              }`}
            >
              {status || "All orders"}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-3.5" aria-label="Loading orders">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-2xl border border-[#E8E2D8] bg-white p-5 sm:p-6"
            >
              <div className="mb-4 h-4 w-1/3 rounded bg-border" />
              <div className="h-3 w-1/2 rounded bg-border/70" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-[24px] border border-[#E8E2D8] bg-white px-6 py-12 text-center shadow-[0_14px_40px_rgba(72,65,52,0.055)] sm:py-16">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <AlertTriangle size={25} strokeWidth={1.8} />
          </div>
          <h2 className="font-heading text-2xl font-medium text-[#292925]">
            Orders couldn&apos;t load
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6e6e64]">
            {error}
          </p>
          <button
            type="button"
            onClick={() => setRefreshKey((key) => key + 1)}
            className="btn btn-primary mt-6"
          >
            Try again
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="overflow-hidden rounded-[24px] border border-[#E8E2D8] bg-white shadow-[0_14px_40px_rgba(72,65,52,0.055)]">
          <div className="px-6 py-12 text-center sm:px-10 sm:py-14">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-secondary">
              <Package size={29} strokeWidth={1.55} />
            </div>
            <h2 className="font-heading text-2xl font-medium text-[#292925] sm:text-[28px]">
              {statusFilter
                ? `No ${statusFilter.toLowerCase()} orders`
                : "Your order history starts here"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6e6e64] sm:text-[15px]">
              {statusFilter
                ? "There are no orders matching this status right now. Try another filter to see the rest of your history."
                : "Once you place an order, you can follow its progress and revisit every purchase from this page."}
            </p>

            {statusFilter ? (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("");
                  setPage(1);
                }}
                className="mt-6 rounded-full border border-secondary/25 bg-white px-6 py-3 text-sm font-semibold text-secondary transition-colors hover:bg-secondary hover:text-light"
              >
                View all orders
              </button>
            ) : (
              <Link to="/products" className="btn btn-primary mt-6">
                Browse the store <ChevronRight size={16} />
              </Link>
            )}
          </div>

          {!statusFilter && (
            <div className="grid border-t border-[#E8E2D8] bg-light/60 sm:grid-cols-3">
              <OrderBenefit icon={ShieldCheck} label="Secure checkout" />
              <OrderBenefit icon={Bell} label="Status updates" />
              <OrderBenefit icon={Truck} label="Delivery tracking" />
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3.5">
            {orders.map((order) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
              return (
                <Link
                  key={order._id}
                  to={`/orders/${order._id}`}
                  className="group flex flex-col gap-5 rounded-2xl border border-[#E8E2D8] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#cfc8ba] hover:shadow-[0_12px_28px_rgba(72,65,52,0.07)] sm:flex-row sm:items-center sm:p-6"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#E8E2D8] bg-light">
                      {order.items?.[0]?.image?.url ? (
                        <img
                          src={order.items[0].image.url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package size={20} className="text-[#c9c2b3]" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <p className="truncate text-sm font-semibold text-[#292925]">
                        {order.items?.length} item{order.items?.length !== 1 ? "s" : ""}
                        {order.items?.length > 0 &&
                          ` · ${order.items[0].name}${
                            order.items.length > 1
                              ? ` +${order.items.length - 1} more`
                              : ""
                          }`}
                      </p>
                      <p className="mt-1 text-[12px] text-[#8a8a80]">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#eee9df] pt-4 sm:justify-end sm:border-0 sm:pt-0">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${cfg.color}`}>
                      <StatusIcon size={11} /> {order.status}
                    </span>
                    <p className="font-semibold text-[#292925]">
                      {formatPrice(order.totalAmount)}
                    </p>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E8E2D8] text-[#c9c2b3] transition-all group-hover:border-secondary group-hover:bg-secondary group-hover:text-light">
                      <ChevronRight size={17} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2.5">
              {[...Array(pagination.totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  type="button"
                  aria-label={`Go to page ${index + 1}`}
                  aria-current={page === index + 1 ? "page" : undefined}
                  onClick={() => setPage(index + 1)}
                  className={`h-9 w-9 rounded-full text-sm font-semibold transition-colors ${
                    page === index + 1
                      ? "bg-secondary text-light"
                      : "border border-border bg-white text-secondary hover:bg-light"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OrderBenefit({ icon, label }) {
  const Icon = icon;
  return (
    <div className="flex items-center justify-center gap-2.5 border-b border-[#E8E2D8] px-4 py-4 text-xs font-medium text-[#4f4f48] last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0">
      <Icon size={16} className="text-secondary" strokeWidth={1.8} />
      <span>{label}</span>
    </div>
  );
}
