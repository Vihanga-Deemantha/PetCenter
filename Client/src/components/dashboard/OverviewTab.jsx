import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, Heart, Gift, Boxes, ArrowRight, Clock, Truck, CheckCircle, XCircle } from "lucide-react";
import { getUserOrders } from "../../api/order.api";
import { getMyDonations } from "../../api/donation.api";
import { getMyBuilds } from "../../api/ecosystem.api";
import { useAuth } from "../../context/AuthContext";
import { useFavorites } from "../../context/FavoritesContext";
import { formatPrice } from "../../utils/priceFormatter";

const STATUS_CONFIG = {
  processing: { color: "bg-[#F7E9DF] text-[#8f4a28]", icon: Clock },
  shipped: { color: "bg-[#E4EAF2] text-[#31506f]", icon: Truck },
  delivered: { color: "bg-[#E9EDE4] text-[#40543C]", icon: CheckCircle },
  cancelled: { color: "bg-rose-50 text-rose-700", icon: XCircle },
  pending: { color: "bg-[#EFEBE2] text-[#6e6e64]", icon: Clock },
};

export default function OverviewTab({ onNavigateTab }) {
  const { user } = useAuth();
  const { count: favCount } = useFavorites();
  const [recentOrders, setRecentOrders] = useState([]);
  const [orderCount, setOrderCount] = useState(null);
  const [donationsTotal, setDonationsTotal] = useState(null);
  const [buildCount, setBuildCount] = useState(null);
  const [savedBuilds, setSavedBuilds] = useState([]);

  useEffect(() => {
    getUserOrders({ page: 1, limit: 3 })
      .then((res) => {
        setRecentOrders(res.data.data.orders || []);
        setOrderCount(res.data.data.pagination?.totalItems ?? 0);
      })
      .catch(() => { setRecentOrders([]); setOrderCount(0); });

    getMyDonations()
      .then((res) => {
        const list = res.data.data || [];
        setDonationsTotal(list.reduce((sum, d) => sum + (d.amount || 0), 0));
      })
      .catch(() => setDonationsTotal(0));

    getMyBuilds()
      .then((res) => {
        const list = res.data.data || [];
        setBuildCount(list.length);
        setSavedBuilds(list.slice(0, 3));
      })
      .catch(() => setBuildCount(0));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs tracking-[0.18em] uppercase text-accent font-semibold mb-2.5">Dashboard</p>
        <h1 className="font-heading text-[30px] sm:text-[36px] font-medium tracking-tight text-[#292925]">Welcome back, {user?.name?.split(" ")[0]}</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-9">
        <StatCard icon={Package} label="Orders" value={orderCount} onClick={() => onNavigateTab("orders")} />
        <StatCard icon={Heart} label="Saved items" value={favCount} onClick={() => onNavigateTab("favorites")} />
        <StatCard icon={Gift} label="Donated" value={donationsTotal == null ? null : `$${(donationsTotal / 100).toFixed(2)}`} onClick={() => onNavigateTab("donations")} />
        <StatCard icon={Boxes} label="Habitat builds" value={buildCount} onClick={() => onNavigateTab("builds")} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E8E2D8] rounded-[22px] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="m-0 font-heading text-lg font-medium text-[#292925]">Recent orders</h2>
            <button onClick={() => onNavigateTab("orders")} className="text-xs font-semibold text-primary flex items-center gap-1">
              View all <ArrowRight size={12} />
            </button>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-[#8a8a80]">No orders yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {recentOrders.map((order) => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const StatusIcon = cfg.icon;
                return (
                  <Link key={order._id} to={`/orders/${order._id}`} className="flex items-center gap-3 p-2.5 -mx-2.5 rounded-xl hover:bg-light transition-colors">
                    <div className="w-11 h-11 rounded-lg overflow-hidden bg-light border border-border shrink-0">
                      {order.items?.[0]?.image?.url ? (
                        <img src={order.items[0].image.url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Package size={16} className="text-[#c9c2b3]" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="m-0 text-[13px] font-semibold text-[#292925] truncate">{order.items?.[0]?.name}{order.items?.length > 1 ? ` +${order.items.length - 1} more` : ""}</p>
                      <p className="m-0 text-[11px] text-[#8a8a80]">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider shrink-0 ${cfg.color}`}>
                      <StatusIcon size={10} /> {order.status}
                    </span>
                    <p className="m-0 text-[13px] font-semibold text-[#292925] shrink-0">{formatPrice(order.totalAmount)}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-[#E8E2D8] rounded-[22px] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="m-0 font-heading text-lg font-medium text-[#292925]">Saved builds</h2>
            <button onClick={() => onNavigateTab("builds")} className="text-xs font-semibold text-primary flex items-center gap-1">
              View all <ArrowRight size={12} />
            </button>
          </div>
          {savedBuilds.length === 0 ? (
            <p className="text-sm text-[#8a8a80]">No habitat builds saved yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {savedBuilds.map((build) => (
                <button key={build._id} onClick={() => onNavigateTab("builds")} className="flex items-center gap-3 p-2.5 -mx-2.5 rounded-xl hover:bg-light transition-colors text-left w-full">
                  <div className="w-11 h-11 rounded-lg bg-accent/10 flex items-center justify-center text-lg shrink-0 capitalize">🌿</div>
                  <div className="flex-1 min-w-0">
                    <p className="m-0 text-[13px] font-semibold text-[#292925] truncate">{build.name}</p>
                    <p className="m-0 text-[11px] text-[#8a8a80] capitalize">{build.petType} · {build.selections?.length || 0} items</p>
                  </div>
                  <p className="m-0 text-[13px] font-semibold text-[#292925] shrink-0">{formatPrice(build.totalPrice)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, onClick }) {
  const Icon = icon;
  return (
    <button onClick={onClick} className="bg-white border border-[#E8E2D8] rounded-2xl p-5 text-left hover:border-[#cfc8ba] hover:shadow-sm transition-all">
      <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-secondary mb-3">
        <Icon size={16} />
      </div>
      <p className="m-0 font-heading text-2xl font-medium text-[#292925]">{value == null ? "—" : value}</p>
      <p className="m-0 mt-0.5 text-[12px] text-[#8a8a80]">{label}</p>
    </button>
  );
}
