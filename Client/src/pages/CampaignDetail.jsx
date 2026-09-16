import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "../utils/stripeConfig";
import { Heart, Calendar, Users, MessageSquare, AlertCircle, ArrowLeft, Lock, Gift, Clock, Landmark, X, ShieldCheck, ArrowRight } from "lucide-react";
import { getCampaignDetail } from "../api/campaign.api";
import { createDonationPaymentIntent } from "../api/donation.api";
import StripeDonationForm from "../components/campaigns/StripeDonationForm";
import { formatPrice } from "../utils/priceFormatter";

const PRESETS = [1000, 2500, 5000, 10000];

// parseInt would silently truncate a typed "12.75" to 12 (1200 cents instead
// of 1275) — round the dollar amount to the nearest cent instead.
const toCents = (dollarInput) => Math.round(parseFloat(dollarInput) * 100);

const fieldCls = "border border-border rounded-2xl px-4 py-3.25 text-sm text-[#292925] bg-light outline-none focus:border-accent transition-colors";

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [amount, setAmount] = useState(2500);
  const [customAmountInput, setCustomAmountInput] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [message, setMessage] = useState("");

  const [clientSecret, setClientSecret] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  const fetchDetails = useCallback(async () => {
    try {
      const res = await getCampaignDetail(id);
      setCampaign(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load campaign details.");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleInitiateDonation = async (e) => {
    if (e) e.preventDefault();
    setCreatingIntent(true);
    setPaymentError(null);

    const finalAmount = isCustom ? toCents(customAmountInput) : amount;
    if (isNaN(finalAmount) || finalAmount < 50) {
      setPaymentError("Donation amount must be at least $0.50");
      setCreatingIntent(false);
      return;
    }

    try {
      const donationData = {
        campaignId: id,
        amount: finalAmount,
        displayName: isAnonymous ? "Anonymous" : displayName || "Anonymous",
        message: message || "",
      };
      const res = await createDonationPaymentIntent(donationData);
      setClientSecret(res.data.data.clientSecret);
      setShowPayment(true);
    } catch (err) {
      setPaymentError(err.response?.data?.message || "Stripe setup failed. Please try again.");
    }
    setCreatingIntent(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-9 h-9 rounded-full border-2 border-border border-t-accent animate-spin" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="max-w-7xl mx-auto px-7 py-20 text-center max-w-lg">
        <AlertCircle className="mx-auto mb-4 text-[#b4573a]" size={44} />
        <h2 className="font-heading text-2xl mb-2">Error loading campaign</h2>
        <p className="text-[#6e6e64] mb-6">{error || "Campaign not found"}</p>
        <Link to="/campaigns" className="btn btn-primary">
          Back to campaigns
        </Link>
      </div>
    );
  }

  const progress = Math.min(100, (campaign.raisedAmount / campaign.goalAmount) * 100);
  const isExpired = campaign.deadline && new Date(campaign.deadline) < new Date();
  const canDonate = campaign.status === "active" && !isExpired;
  const finalDonationAmount = isCustom ? toCents(customAmountInput) : amount;

  const getDaysLeft = () => {
    if (!campaign.deadline) return null;
    const days = Math.ceil((new Date(campaign.deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };
  const daysLeft = getDaysLeft();

  const stripeOptions = clientSecret
    ? {
        clientSecret,
        appearance: { theme: "stripe", variables: { colorPrimary: "#C87550", colorBackground: "#ffffff", colorText: "#292925", borderRadius: "14px", fontFamily: "Inter, sans-serif" } },
      }
    : null;

  const donationForm = (
    <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => { setAmount(p); setIsCustom(false); }}
            className={`py-2.5 rounded-xl text-[13px] font-semibold border transition-colors ${amount === p && !isCustom ? "bg-secondary text-light border-secondary" : "bg-white text-[#3f3f38] border-border hover:bg-light"}`}
          >
            ${p / 100}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-1.75 text-[11px] font-semibold uppercase tracking-wider text-[#8a8a7e]">
        Custom amount ($)
        <input type="number" min="1" placeholder="Other amount" value={customAmountInput} onChange={(e) => { setCustomAmountInput(e.target.value); setIsCustom(true); }} className={fieldCls} />
      </label>

      <div>
        <div className="flex items-center justify-between mb-1.75">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[#8a8a7e]">Your display name</label>
          <label className="flex items-center gap-1.5 text-xs text-[#8a8a80] font-medium cursor-pointer">
            <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="accent-accent" />
            Anonymous
          </label>
        </div>
        <input
          type="text"
          placeholder="Anonymous"
          disabled={isAnonymous}
          value={isAnonymous ? "" : displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={`${fieldCls} disabled:bg-border/40 disabled:text-[#a8a49a]`}
        />
      </div>

      <label className="flex flex-col gap-1.75 text-[11px] font-semibold uppercase tracking-wider text-[#8a8a7e]">
        Add a message (optional)
        <textarea rows="2" maxLength="300" placeholder="Leave a message of encouragement..." value={message} onChange={(e) => setMessage(e.target.value)} className={`${fieldCls} resize-none normal-case font-normal tracking-normal text-sm`} />
      </label>

      {paymentError && (
        <div className="flex items-start gap-2.5 p-3.5 bg-[#F7E9DF] text-[#8f4a28] rounded-xl text-xs font-medium">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <p className="m-0">{paymentError}</p>
        </div>
      )}

      <button type="button" onClick={handleInitiateDonation} disabled={creatingIntent} className="btn btn-primary w-full py-3.5">
        {creatingIntent ? (
          <>
            <div className="w-4.5 h-4.5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Securing Stripe...
          </>
        ) : (
          <>
            <Heart size={16} className="fill-current" /> Continue to payment
          </>
        )}
      </button>
    </Motion.div>
  );

  return (
    <div className="max-w-7xl mx-auto px-7 pt-6 pb-24 relative">
      <Link to="/campaigns" className="inline-flex items-center gap-2 text-[13.5px] font-medium text-[#6e6e64] hover:text-primary transition-colors mb-6">
        <ArrowLeft size={16} /> All campaigns
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-9 items-start">
        <div className="min-w-0">
          <div className="rounded-[26px] overflow-hidden border border-[#dcd4c6] bg-border">
            <div className="aspect-16/10 relative">
              <img src={campaign.images[0]?.url || "https://images.unsplash.com/photo-1548199973-03cce0bbc87b"} alt={campaign.title} className="w-full h-full object-cover" />
              <span className="absolute top-4.5 left-4.5 bg-light/94 text-secondary text-[11.5px] font-semibold tracking-wider uppercase px-3.5 py-2 rounded-full">{campaign.category}</span>
            </div>
            {campaign.images.length > 1 && (
              <div className="flex gap-3 p-3.5 overflow-x-auto bg-light border-t border-border">
                {campaign.images.map((img) => (
                  <img key={img.publicId} src={img.url} alt="" className="w-20 h-16 object-cover rounded-lg border border-border shrink-0" />
                ))}
              </div>
            )}
          </div>

          <div className="mt-9">
            <h1 className="font-heading text-[34px] sm:text-[42px] font-medium tracking-tight mb-4">{campaign.title}</h1>

            <div className="flex flex-wrap gap-5 text-sm text-[#6e6e64] border-b border-border pb-5 mb-6">
              <span className="flex items-center gap-1.75 text-secondary font-medium">
                <Heart size={15} className="fill-current" /> {campaign.donorCount} donors
              </span>
              {campaign.deadline && (
                <span className="flex items-center gap-1.75">
                  <Calendar size={15} /> Ends {new Date(campaign.deadline).toLocaleDateString()}
                </span>
              )}
              {campaign.beneficiary && (
                <span className="flex items-center gap-1.75">
                  <Landmark size={15} /> Run by{" "}
                  <Link to={`/shelters/${campaign.beneficiary._id}`} className="text-primary hover:underline">
                    {campaign.beneficiary.name}
                  </Link>
                </span>
              )}
            </div>

            <div
              className="bg-white border border-border rounded-[24px] p-8 text-[15.5px] leading-relaxed text-[#5c5c54] [&_p]:m-0 [&_p+p]:mt-4 [&_strong]:text-[#292925] [&_strong]:font-semibold [&_ul]:pl-5 [&_ul]:list-disc [&_a]:text-secondary [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: campaign.description }}
            />
          </div>

          <div className="bg-white border border-border rounded-[24px] p-8 mt-4">
            <h3 className="font-heading text-xl font-medium mb-6 flex items-center gap-2.5">
              <Users className="text-accent" size={19} /> Donor wall ({campaign.lastDonors?.length || 0})
            </h3>
            {campaign.lastDonors?.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-border rounded-2xl">
                <Gift size={28} className="mx-auto mb-2 text-[#c9c2b3]" />
                <p className="text-[#8a8a80] text-sm">Be the first to donate and support this cause!</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {campaign.lastDonors.map((don, idx) => (
                  <Motion.div key={don.createdAt + idx} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }} className="flex items-start gap-3.5 p-4 rounded-2xl border border-border bg-light">
                    <div className="w-9.5 h-9.5 rounded-full bg-accent/10 text-secondary flex items-center justify-center font-semibold text-sm shrink-0">{don.displayName.substring(0, 2).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <h4 className="font-semibold text-[#292925] text-sm m-0">{don.displayName}</h4>
                        <span className="font-semibold text-primary text-sm whitespace-nowrap">{formatPrice(don.amount)}</span>
                      </div>
                      {don.message && (
                        <p className="text-[#5c5c54] text-xs flex items-start gap-1.5 m-0">
                          <MessageSquare size={12} className="shrink-0 mt-0.5 text-[#8a8a80]" />
                          <span>"{don.message}"</span>
                        </p>
                      )}
                      <span className="text-[11px] text-[#8a8a80] mt-1.5 block">{new Date(don.createdAt).toLocaleDateString()}</span>
                    </div>
                  </Motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-28">
          <div className="bg-white border border-border rounded-[24px] p-6.5">
            <h3 className="font-heading text-lg font-medium mb-4 flex items-center gap-2">
              <Heart className="text-primary fill-current" size={17} /> Support this cause
            </h3>

            <div className="mb-6">
              <div className="flex justify-between items-baseline">
                <span className="font-heading text-[30px] font-medium">{formatPrice(campaign.raisedAmount)}</span>
                <span className="text-xs text-[#8a8a80]">of {formatPrice(campaign.goalAmount)} goal</span>
              </div>
              <div className="h-2 rounded-full bg-border overflow-hidden mt-2.5 mb-2">
                <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between text-xs text-[#8a8a80]">
                <span>{progress.toFixed(0)}% reached</span>
                {daysLeft !== null && (
                  <span className="flex items-center gap-1 text-[#292925] font-medium">
                    <Clock size={11} /> {daysLeft} days left
                  </span>
                )}
              </div>
            </div>

            {canDonate ? (
              <AnimatePresence mode="wait">{!clientSecret ? donationForm : (
                <Motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="border-t border-border pt-5 mt-5">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5 text-secondary">
                    <Lock size={13} /> Finalize contribution
                  </h4>
                  <Elements stripe={stripePromise} options={stripeOptions}>
                    <StripeDonationForm amountInCents={finalDonationAmount} onSuccess={(intentId) => navigate(`/thank-you?paymentIntent=${intentId}`)} />
                  </Elements>
                </Motion.div>
              )}</AnimatePresence>
            ) : (
              <div className="p-4 bg-light text-[#8a8a80] rounded-2xl border border-border text-center text-xs font-medium space-y-1">
                <AlertCircle className="mx-auto mb-1 text-[#a8a49a]" size={18} />
                <p className="m-0">This campaign has ended.</p>
              </div>
            )}
          </div>

          {campaign.beneficiary && (
            <div className="bg-border border border-[#ded6c8] rounded-[24px] p-6.5 mt-4">
              <p className="m-0 mb-3.5 text-[11px] tracking-wider uppercase text-secondary font-semibold">Run by</p>
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-accent text-light flex items-center justify-center font-heading text-lg shrink-0 overflow-hidden">
                  {campaign.beneficiary.logo?.url ? (
                    <img src={campaign.beneficiary.logo.url} alt={campaign.beneficiary.name} className="w-full h-full object-cover" />
                  ) : (
                    campaign.beneficiary.name[0]
                  )}
                </div>
                <div className="min-w-0">
                  <p className="m-0 font-semibold text-[#292925] text-[15px] truncate">{campaign.beneficiary.name}</p>
                  {campaign.beneficiary.isVerified && (
                    <p className="m-0 mt-0.5 flex items-center gap-1.25 text-xs text-[#40543C] font-medium">
                      <ShieldCheck size={12} /> Verified shelter
                    </p>
                  )}
                </div>
              </div>
              <Link to={`/shelters/${campaign.beneficiary._id}`} className="inline-flex items-center gap-1.5 mt-4 text-[13px] font-medium text-secondary hover:underline">
                View shelter <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showPayment && clientSecret && (
          <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
            <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setShowPayment(false)} className="absolute inset-0 bg-[#292925]" />
            <Motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="relative w-full max-w-md bg-light rounded-t-[28px] p-6 shadow-2xl border border-border z-10 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="w-11 h-1.5 bg-border rounded-full mx-auto mb-2" />
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-1.5 text-secondary m-0">
                  <Heart size={17} className="fill-current" /> Finalize donation
                </h3>
                <button onClick={() => setShowPayment(false)} className="text-[#8a8a80] hover:text-[#292925]">
                  <X size={18} />
                </button>
              </div>
              <Elements stripe={stripePromise} options={stripeOptions}>
                <StripeDonationForm amountInCents={finalDonationAmount} onSuccess={(intentId) => navigate(`/thank-you?paymentIntent=${intentId}`)} />
              </Elements>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CampaignDetail;
