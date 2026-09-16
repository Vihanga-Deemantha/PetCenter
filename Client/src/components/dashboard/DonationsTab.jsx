import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, Calendar, ArrowRight, Gift, MessageSquare, AlertCircle } from "lucide-react";
import { getMyDonations } from "../../api/donation.api";

export default function DonationsTab() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMyDonations()
      .then((res) => setDonations(res.data.data || []))
      .catch((err) => setError(err.response?.data?.message || "Failed to load your donations."))
      .finally(() => setLoading(false));
  }, []);

  const total = donations.reduce((sum, d) => sum + (d.amount || 0), 0);

  return (
    <div>
      <div className="mb-7">
        <p className="text-xs tracking-[0.18em] uppercase text-accent font-semibold mb-2.5">Dashboard</p>
        <h1 className="font-heading text-[30px] sm:text-[36px] font-medium tracking-tight text-[#292925]">Your donations</h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-border rounded-2xl animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 p-4 bg-[#F7E9DF] text-[#8f4a28] rounded-2xl border border-[#f0d9c5]">
          <AlertCircle size={18} className="shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : donations.length === 0 ? (
        <div className="bg-white border border-dashed border-[#dcd4c6] rounded-[22px] py-14 px-8 text-center">
          <Gift size={36} className="mx-auto mb-3.5 text-[#c9c2b3]" />
          <h3 className="font-heading text-xl font-medium mb-1.5">No donations yet</h3>
          <p className="text-[#6e6e64] text-sm mb-6 max-w-xs mx-auto">Explore our active campaigns to find a cause you care about.</p>
          <Link to="/campaigns" className="btn btn-primary">
            Explore campaigns <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-secondary text-light rounded-2xl px-6 py-5 mb-7 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-[#C8CFC1]">Total given</p>
              <p className="m-0 mt-1 font-heading text-[28px] font-medium">${(total / 100).toFixed(2)}</p>
            </div>
            <Link to="/campaigns" className="btn btn-primary px-5 py-2.5 text-xs">
              Give again <ArrowRight size={13} />
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {donations.map((don) => {
              const campaign = don.campaignId;
              if (!campaign) return null;
              return (
                <div key={don._id} className="bg-white border border-[#E8E2D8] rounded-2xl px-5 py-4.5 flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-13 h-13 rounded-xl bg-light overflow-hidden shrink-0 border border-border">
                      <img
                        src={campaign.images?.[0]?.url || "https://images.unsplash.com/photo-1548199973-03cce0bbc87b"}
                        alt={campaign.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1 block">{campaign.category}</span>
                      <Link to={`/campaigns/${campaign._id}`} className="font-heading text-[15px] font-medium text-[#292925] hover:text-primary transition-colors">
                        {campaign.title}
                      </Link>
                      <div className="flex items-center gap-1.5 text-xs text-[#8a8a80] font-medium mt-1.5">
                        <Calendar size={12} />
                        <span>{new Date(don.createdAt).toLocaleDateString()}</span>
                      </div>
                      {don.message && (
                        <div className="flex items-start gap-1.5 p-2.5 bg-light border border-border rounded-xl mt-2.5 text-[#6e6e64] text-xs max-w-md">
                          <MessageSquare size={13} className="shrink-0 mt-0.5 text-[#a8a49a]" />
                          <span>"{don.message}"</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="sm:text-right shrink-0 flex flex-row sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-2">
                    <div>
                      <span className="text-[10px] text-[#8a8a80] font-semibold uppercase tracking-wider block">Contribution</span>
                      <span className="text-xl font-heading font-medium text-secondary">${(don.amount / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
