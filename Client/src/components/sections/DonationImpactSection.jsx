import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { getCampaigns } from "../../api/campaign.api";
import { formatPrice } from "../../utils/priceFormatter";

const CampaignsPreviewSection = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCampaigns({ limit: 3, status: "active" })
      .then((res) => setCampaigns(res.data.data || []))
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && campaigns.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-7 pt-24">
      <div className="flex items-end justify-between gap-6 mb-10">
        <div>
          <p className="text-xs tracking-[0.18em] uppercase text-accent font-semibold mb-3">Active campaigns</p>
          <h2 className="font-heading text-[32px] sm:text-[46px] font-medium text-[#292925] tracking-tight">Where your donation goes</h2>
        </div>
        <Link to="/campaigns" className="hidden sm:inline text-sm font-medium text-secondary border-b border-[#cfc8ba] pb-0.75 shrink-0">
          All campaigns
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex flex-col gap-3">
              <div className="aspect-video bg-border rounded-card" />
              <div className="h-5 bg-border w-2/3 rounded-full" />
              <div className="h-4 bg-border/70 w-full rounded-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {campaigns.map((c, i) => {
            const pct = c.goalAmount > 0 ? Math.min(100, Math.round((c.raisedAmount / c.goalAmount) * 100)) : 0;
            return (
              <Motion.article
                key={c._id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className="bg-white border border-[#E8E2D8] rounded-card overflow-hidden flex flex-col"
              >
                <div className="aspect-video overflow-hidden bg-border">
                  {c.images?.[0]?.url && <img src={c.images[0].url} alt={c.title} className="w-full h-full object-cover" />}
                </div>
                <div className="p-5.5 flex flex-col gap-3.5 flex-1">
                  <h3 className="font-heading text-[22px] font-medium text-[#292925] m-0">{c.title}</h3>
                  <p className="m-0 text-sm leading-relaxed text-[#6e6e64] flex-1 line-clamp-3">{c.shortDescription}</p>
                  <div>
                    <div className="h-1.5 rounded-full bg-border overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between mt-2.5 text-[13px] text-[#6e6e64]">
                      <span>{formatPrice(c.raisedAmount)} raised</span>
                      <span>{formatPrice(c.goalAmount)} goal</span>
                    </div>
                  </div>
                  <Link
                    to={`/campaigns/${c._id}`}
                    className="text-center bg-accent text-white rounded-full py-2.75 text-sm font-medium hover:bg-secondary transition-colors"
                  >
                    Donate
                  </Link>
                </div>
              </Motion.article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default CampaignsPreviewSection;
