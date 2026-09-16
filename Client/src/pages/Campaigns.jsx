import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, Clock, Heart } from "lucide-react";
import { getCampaigns } from "../api/campaign.api";
import { formatPrice } from "../utils/priceFormatter";

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "medical", label: "Medical" },
  { value: "shelter", label: "Facilities" },
  { value: "food", label: "Food" },
  { value: "rescue", label: "Rescue" },
  { value: "rehabilitation", label: "Rehab" },
  { value: "general", label: "General" },
];

const chipCls = (active) =>
  `inline-flex items-center justify-center whitespace-nowrap rounded-full px-5 py-2.75 text-[13px] font-medium border transition-colors ${
    active ? "bg-accent text-white border-accent" : "bg-white text-secondary border-border hover:bg-light"
  }`;

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 9 };
      if (search) params.search = search;
      if (category) params.category = category;
      const res = await getCampaigns(params);
      setCampaigns(res.data.data || []);
      setPagination(res.data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 });
    } catch (err) {
      console.error(err);
      setCampaigns([]);
    }
    setLoading(false);
  }, [page, search, category]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const statsTotalRaised = campaigns.reduce((acc, c) => acc + c.raisedAmount, 0);
  const statsTotalDonors = campaigns.reduce((acc, c) => acc + c.donorCount, 0);

  const featured = campaigns.find((c) => c.featuredOrder !== null && c.status === "active");
  const activeCampaigns = campaigns.filter((c) => c.status === "active" && c._id !== featured?._id);
  const completedOrClosed = campaigns.filter((c) => ["goal_reached", "expired", "closed"].includes(c.status));

  const daysLeft = (deadline) => {
    if (!deadline) return null;
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <div className="max-w-7xl mx-auto px-7 pb-24">
      <section className="border-b border-border">
        <div className="pt-13 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <Motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs tracking-[0.18em] uppercase text-accent font-semibold mb-3.5">Campaigns</p>
            <h1 className="font-heading text-[38px] sm:text-[52px] font-medium mb-4 tracking-tight leading-[1.06]">
              Where your
              <br />
              donation <span className="italic text-accent">goes</span>
            </h1>
            <p className="text-[15px] leading-relaxed text-[#5c5c54] max-w-130 mb-7">
              Each campaign is run by a shelter we work with directly. Every contribution goes straight to that cause.
            </p>
            <div className="grid grid-cols-2 gap-5 border-t border-border pt-6.5 max-w-95">
              <div>
                <p className="m-0 font-heading text-[26px]">{formatPrice(statsTotalRaised)}</p>
                <p className="mt-1 text-[11px] tracking-wider uppercase text-[#8a8a80]">Raised (this page)</p>
              </div>
              <div>
                <p className="m-0 font-heading text-[26px]">{statsTotalDonors}</p>
                <p className="mt-1 text-[11px] tracking-wider uppercase text-[#8a8a80]">Donors (this page)</p>
              </div>
            </div>
          </Motion.div>

          <Motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="relative hidden sm:block">
            <div className="relative rounded-[26px] overflow-hidden aspect-4/3 bg-border border border-[#dcd4c6]">
              {featured ? (
                <>
                  <img src={featured.images[0]?.url || "https://images.unsplash.com/photo-1548199973-03cce0bbc87b"} alt={featured.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-linear-to-t from-[#292925]/45 to-transparent pointer-events-none" />
                  <div className="absolute left-5 bottom-5 right-5">
                    <p className="m-0 text-[11px] tracking-wider uppercase text-border">{featured.category}</p>
                    <p className="mt-1 font-heading text-xl text-white font-medium line-clamp-1">{featured.title}</p>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Heart size={48} className="text-[#c9c2b3]" />
                </div>
              )}
            </div>
            <div className="absolute -left-6 top-7 bg-light border border-border rounded-2xl px-4.5 py-3.5 shadow-xl shadow-black/10">
              <p className="m-0 text-[11px] tracking-wider uppercase text-accent">{featured ? "Urgent" : "This page"}</p>
              <p className="mt-0.75 mb-0 text-sm font-semibold">{formatPrice(featured ? featured.raisedAmount : statsTotalRaised)} raised</p>
            </div>
          </Motion.div>
        </div>
      </section>

      {featured && (
        <section className="pt-11">
          <div className="bg-secondary rounded-[26px] overflow-hidden grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] text-light">
            <div className="relative min-h-70 bg-[#3F4A3C]">
              <img src={featured.images[0]?.url || "https://images.unsplash.com/photo-1548199973-03cce0bbc87b"} alt={featured.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-9 sm:p-11 flex flex-col gap-4.5">
              <p className="m-0 text-[11px] tracking-wider uppercase text-[#C8CFC1] font-semibold">
                Urgent{daysLeft(featured.deadline) !== null && ` · closes in ${daysLeft(featured.deadline)} days`}
              </p>
              <h2 className="m-0 font-heading text-[30px] font-medium leading-[1.15] tracking-tight">{featured.title}</h2>
              <p className="m-0 text-[15px] leading-relaxed text-[#DCE0D6] line-clamp-3">{featured.shortDescription}</p>
              <div>
                <div className="h-1.75 rounded-full bg-light/22 overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (featured.raisedAmount / featured.goalAmount) * 100)}%` }} />
                </div>
                <div className="flex justify-between mt-2.5 text-sm text-[#DCE0D6]">
                  <span>{formatPrice(featured.raisedAmount)} raised</span>
                  <span>{formatPrice(featured.goalAmount)} goal</span>
                </div>
              </div>
              <Link to={`/campaigns/${featured._id}`} className="btn bg-primary text-white hover:bg-primary-dark w-fit mt-1.5">
                Donate to this campaign <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="pt-16">
        <div className="flex items-end justify-between gap-6 flex-wrap mb-7">
          <div>
            <p className="text-xs tracking-[0.18em] uppercase text-accent font-semibold mb-3">Open now</p>
            <h2 className="font-heading text-[32px] sm:text-[42px] font-medium tracking-tight m-0">{pagination.totalItems} funding</h2>
          </div>
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8a80]" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.75 rounded-full border border-border bg-white text-sm outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button key={cat.value} onClick={() => { setCategory(cat.value); setPage(1); }} className={chipCls(category === cat.value)}>
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-card bg-border animate-pulse aspect-4/5" />
            ))}
          </div>
        ) : activeCampaigns.length === 0 && !featured ? (
          <div className="text-center py-16 bg-white border border-dashed border-[#dcd4c6] rounded-card">
            <p className="text-[#8a8a80] font-medium">No campaigns match your filters right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {activeCampaigns.map((camp) => {
                const progress = Math.min(100, (camp.raisedAmount / camp.goalAmount) * 100);
                const days = daysLeft(camp.deadline);
                const urgent = days !== null && days <= 10;
                return (
                  <Motion.article
                    key={camp._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-white border border-[#E8E2D8] rounded-card overflow-hidden flex flex-col transition-all duration-400 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/10"
                  >
                    <div className="aspect-video overflow-hidden bg-border">
                      <img src={camp.images[0]?.url || "https://images.unsplash.com/photo-1548199973-03cce0bbc87b"} alt={camp.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-5.5 flex flex-col gap-3 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-[#F2EFE7] border border-border text-secondary text-[11px] px-2.5 py-1 rounded-full capitalize">{camp.category}</span>
                        {days !== null && <span className="text-xs" style={{ color: urgent ? "#A8522C" : "#6e6e64" }}>{days} days left</span>}
                      </div>
                      <h3 className="m-0 font-heading text-[21px] font-medium leading-tight">{camp.title}</h3>
                      <p className="m-0 text-sm leading-relaxed text-[#6e6e64] flex-1 line-clamp-2">{camp.shortDescription}</p>
                      <div>
                        <div className="h-1.5 rounded-full bg-border overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="flex justify-between mt-2.5 text-[13px] text-[#6e6e64]">
                          <span>{formatPrice(camp.raisedAmount)} raised</span>
                          <span>{formatPrice(camp.goalAmount)} goal</span>
                        </div>
                      </div>
                      <Link to={`/campaigns/${camp._id}`} className="text-center border border-[#cfc8ba] rounded-full py-2.5 text-[13px] font-medium text-secondary hover:bg-accent hover:text-white hover:border-accent transition-colors">
                        Donate
                      </Link>
                    </div>
                  </Motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </section>

      {completedOrClosed.length > 0 && (
        <section className="pt-16 mt-4 border-t border-border">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8a8a80] mb-6 mt-16">Completed &amp; past campaigns</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80">
            {completedOrClosed.map((camp) => (
              <div key={camp._id} className="bg-white border border-border rounded-card overflow-hidden grayscale">
                <div className="aspect-16/9 overflow-hidden bg-border">
                  <img src={camp.images[0]?.url || "https://images.unsplash.com/photo-1548199973-03cce0bbc87b"} alt={camp.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-4.5">
                  <Link to={`/campaigns/${camp._id}`} className="font-semibold text-[#3f3f38] line-clamp-1">
                    {camp.title}
                  </Link>
                  <p className="mt-1 text-[12px] text-[#8a8a80]">
                    {camp.status === "goal_reached" ? "Goal reached" : "Closed"} · {formatPrice(camp.raisedAmount)} of {formatPrice(camp.goalAmount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2.5 mt-13">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`min-w-10 h-10 px-3 rounded-xl text-sm font-medium border transition-colors ${
                p === pagination.currentPage ? "bg-accent text-white border-accent" : "bg-white text-[#3f3f38] border-border hover:border-accent"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <section className="mt-20">
        <div className="bg-accent text-light rounded-[28px] p-11 sm:p-14 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-9 items-center">
          <div>
            <h2 className="font-heading text-[28px] sm:text-[36px] font-medium mb-2.5 tracking-tight">Run a shelter? Start a campaign</h2>
            <p className="m-0 text-base leading-relaxed text-[#EDEFE8] max-w-130">Tell us what you need and what it costs — we'll help you get it published.</p>
          </div>
          <Link to="/contact" className="btn bg-primary text-white hover:bg-primary-dark px-7.5 py-4 whitespace-nowrap w-fit">
            Get in touch <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Campaigns;
