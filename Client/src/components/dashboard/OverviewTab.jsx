import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, Heart, Gift, Boxes, ArrowRight, ArrowUpRight, Clock, Truck, CheckCircle, XCircle, ShoppingBag, Plus } from "lucide-react";
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
      <div className="mb-8 sm:mb-10">
        <p className="text-[11px] tracking-[0.2em] uppercase text-accent font-semibold mb-3">Your account</p>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-[34px] sm:text-[42px] font-medium tracking-[-0.025em] leading-[1.05] text-[#292925]">
              Welcome back, {user?.name?.split(" ")[0]}
            </h1>
            <p className="mt-3 max-w-xl text-sm sm:text-[15px] leading-6 text-[#6e6e64]">
              Keep track of your orders, saved finds, donations and habitat plans in one place.
            </p>
          </div>
          <Link to="/ecosystem" className="inline-flex items-center justify-center gap-2 self-start sm:self-auto rounded-full border border-[#d9d2c5] bg-white px-4 py-2.5 text-[12.5px] font-semibold whitespace-nowrap text-secondary hover:border-[#bdb4a4] hover:bg-[#fbfaf7] transition-colors">
            <Plus size={14} /> New habitat build
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4 mb-7 sm:mb-8">
        <StatCard icon={Package} label="Orders" helper="Track every purchase" value={orderCount} onClick={() => onNavigateTab("orders")} />
        <StatCard icon={Heart} label="Saved items" helper="Pets and products" value={favCount} onClick={() => onNavigateTab("favorites")} />
        <StatCard icon={Gift} label="Donated" helper="Across your campaigns" value={donationsTotal == null ? null : `$${(donationsTotal / 100).toFixed(2)}`} onClick={() => onNavigateTab("donations")} />
        <StatCard icon={Boxes} label="Habitat builds" helper="Ready to revisit" value={buildCount} onClick={() => onNavigateTab("builds")} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="bg-white border border-[#E8E2D8] rounded-[24px] p-5 sm:p-6.5 min-h-[280px] flex flex-col shadow-[0_12px_35px_rgba(72,65,52,0.035)]">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#eee9df]">
            <div>
              <h2 className="m-0 font-heading text-[20px] font-medium text-[#292925]">Recent orders</h2>
              <p className="mt-1 text-[12px] text-[#8a8a80]">Your latest store purchases</p>
            </div>
            <button onClick={() => onNavigateTab("orders")} className="mt-0.5 text-xs font-semibold text-primary flex items-center gap-1.5 hover:gap-2 transition-all">
              View all <ArrowRight size={12} />
            </button>
          </div>
          {recentOrders.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-7">
              <div className="w-12 h-12 rounded-2xl bg-[#F5F2EB] flex items-center justify-center mb-3.5">
                <ShoppingBag size={20} className="text-[#8f897c]" />
              </div>
              <p className="font-heading text-[17px] font-medium text-[#292925]">Nothing ordered yet</p>
              <p className="mt-1.5 mb-4 text-[12.5px] leading-5 text-[#8a8a80] max-w-[250px]">When you place your first order, its progress will appear here.</p>
              <Link to="/products" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:gap-2 transition-all">
                Browse the store <ArrowRight size={12} />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-1 pt-3">
              {recentOrders.map((order) => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const StatusIcon = cfg.icon;
                return (
                  <Link key={order._id} to={`/orders/${order._id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-light transition-colors">
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
        </section>

        <section className="bg-white border border-[#E8E2D8] rounded-[24px] p-5 sm:p-6.5 min-h-[280px] flex flex-col shadow-[0_12px_35px_rgba(72,65,52,0.035)]">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#eee9df]">
            <div>
              <h2 className="m-0 font-heading text-[20px] font-medium text-[#292925]">Saved builds</h2>
              <p className="mt-1 text-[12px] text-[#8a8a80]">Habitat plans you can return to</p>
            </div>
            <button onClick={() => onNavigateTab("builds")} className="mt-0.5 text-xs font-semibold text-primary flex items-center gap-1.5 hover:gap-2 transition-all">
              View all <ArrowRight size={12} />
            </button>
          </div>
          {savedBuilds.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-7">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-3.5">
                <Boxes size={20} className="text-secondary" />
              </div>
              <p className="font-heading text-[17px] font-medium text-[#292925]">No saved builds yet</p>
              <p className="mt-1.5 mb-4 text-[12.5px] leading-5 text-[#8a8a80] max-w-[250px]">Plan a complete habitat and save it here for later.</p>
              <Link to="/ecosystem" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:gap-2 transition-all">
                Start a habitat <ArrowRight size={12} />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-1 pt-3">
              {savedBuilds.map((build) => (
                <button key={build._id} onClick={() => onNavigateTab("builds")} className="group flex items-center gap-3 p-3 rounded-xl hover:bg-light transition-colors text-left w-full">
                  <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center text-lg shrink-0 capitalize">🌿</div>
                  <div className="flex-1 min-w-0">
                    <p className="m-0 text-[13px] font-semibold text-[#292925] truncate">{build.name}</p>
                    <p className="m-0 text-[11px] text-[#8a8a80] capitalize">{build.petType} · {build.selections?.length || 0} items</p>
                  </div>
                  <p className="m-0 text-[13px] font-semibold text-[#292925] shrink-0">{formatPrice(build.totalPrice)}</p>
                  <ArrowUpRight size={15} className="text-[#c9c2b3] group-hover:text-primary transition-colors shrink-0" />
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon, label, helper, value, onClick }) {
  const Icon = icon;
  return (
    <button onClick={onClick} className="group bg-white border border-[#E8E2D8] rounded-[20px] p-5 text-left hover:-translate-y-0.5 hover:border-[#cfc8ba] hover:shadow-[0_14px_30px_rgba(72,65,52,0.07)] transition-all">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-secondary">
          <Icon size={17} />
        </div>
        <ArrowUpRight size={15} className="text-[#c9c2b3] group-hover:text-primary transition-colors" />
      </div>
      <p className="m-0 font-heading text-[26px] leading-none font-medium text-[#292925]">{value == null ? "—" : value}</p>
      <p className="m-0 mt-2 text-[12.5px] font-semibold text-[#4f4f48]">{label}</p>
      <p className="m-0 mt-1 text-[11px] text-[#9a968c]">{helper}</p>
    </button>
  );
}
