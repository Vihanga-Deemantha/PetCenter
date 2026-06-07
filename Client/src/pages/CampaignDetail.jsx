import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "../utils/stripeConfig";
import { Heart, Calendar, DollarSign, Users, MessageSquare, AlertCircle, ArrowLeft, Lock, Gift, Clock, Landmark } from "lucide-react";
import { getCampaignDetail } from "../api/campaign.api";
import { createDonationPaymentIntent } from "../api/donation.api";
import StripeDonationForm from "../components/campaigns/StripeDonationForm";

const PRESETS = [1000, 2500, 5000, 10000]; // in cents ($10, $25, $50, $100)

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [amount, setAmount] = useState(2500); // default $25
  const [customAmountInput, setCustomAmountInput] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [message, setMessage] = useState("");

  // Payment State
  const [clientSecret, setClientSecret] = useState(null);
  const [showPayment, setShowPayment] = useState(false); // Mobile sheet/Modal trigger
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

  // Handle donation checkout initiation
  const handleInitiateDonation = async (e) => {
    if (e) e.preventDefault();
    setCreatingIntent(true);
    setPaymentError(null);

    const finalAmount = isCustom ? parseInt(customAmountInput) * 100 : amount;
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
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-secondary animate-spin" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen py-16 text-center max-w-lg mx-auto">
        <AlertCircle className="mx-auto mb-4 text-rose-500" size={48} />
        <h2 className="text-2xl font-black text-slate-900 mb-2">Error Loading Campaign</h2>
        <p className="text-slate-500 font-semibold mb-6">{error || "Campaign not found"}</p>
        <Link to="/campaigns" className="btn btn-primary bg-slate-900 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl">
          Back to Campaigns
        </Link>
      </div>
    );
  }

  const progress = Math.min(100, (campaign.raisedAmount / campaign.goalAmount) * 100);
  const isExpired = campaign.deadline && new Date(campaign.deadline) < new Date();
  const canDonate = campaign.status === "active" && !isExpired;

  // Calculate days remaining
  const getDaysLeft = () => {
    if (!campaign.deadline) return null;
    const diff = new Date(campaign.deadline) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };
  const daysLeft = getDaysLeft();

  const stripeOptions = clientSecret ? {
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#f43f5e", // secondary (rose) color
        borderRadius: "12px",
        fontFamily: "Outfit, sans-serif",
      },
    },
  } : null;

  return (
    <div className="min-h-screen py-6 relative">
      <Link to="/campaigns" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-secondary transition-colors mb-6">
        <ArrowLeft size={16} /> All Campaigns
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* ─── Main Details Left Column (ColSpan 2) ────────────────────────────── */}
        <div className="lg:col-span-2 space-y-8">
          {/* Cover & Gallery */}
          <div className="rounded-[32px] overflow-hidden border border-slate-100 shadow-sm bg-white">
            <div className="h-96 md:h-[450px] relative">
              <img 
                src={campaign.images[0]?.url || "https://images.unsplash.com/photo-1548199973-03cce0bbc87b"} 
                alt={campaign.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 px-4 py-1.5 bg-rose-500 text-white rounded-full text-xs font-black uppercase tracking-wider shadow">
                {campaign.category}
              </div>
            </div>
            
            {/* Gallery Thumbnails */}
            {campaign.images.length > 1 && (
              <div className="flex gap-3 p-4 overflow-x-auto bg-slate-50 border-t border-slate-100">
                {campaign.images.map((img, idx) => (
                  <img 
                    key={img.publicId} 
                    src={img.url} 
                    alt={`Gallery ${idx + 1}`} 
                    className="w-20 h-16 object-cover rounded-lg border border-slate-200 shrink-0" 
                  />
                ))}
              </div>
            )}
          </div>

          {/* Campaign Header & Body */}
          <div className="glass-card p-8 bg-white/95 border-slate-100">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-4">
              {campaign.title}
            </h1>

            {/* Campaign metadata */}
            <div className="flex flex-wrap gap-5 text-sm font-bold text-slate-400 border-b border-slate-100 pb-5 mb-6">
              <span className="flex items-center gap-1.5 text-secondary">
                <Heart size={16} className="fill-current" /> {campaign.donorCount} Donors
              </span>
              {campaign.deadline && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={16} /> Ends on {new Date(campaign.deadline).toLocaleDateString()}
                </span>
              )}
              {campaign.beneficiary && (
                <span className="flex items-center gap-1.5">
                  <Landmark size={16} /> Beneficiary: <Link to={`/shelters/${campaign.beneficiary._id}`} className="text-primary hover:underline">{campaign.beneficiary.name}</Link>
                </span>
              )}
            </div>

            {/* Campaign HTML Description */}
            <div 
              className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed"
              dangerouslySetInnerHTML={{ __html: campaign.description }}
            />
          </div>

          {/* Donor Wall (Last 10 Donors) */}
          <div className="glass-card p-8 bg-white/95 border-slate-100">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <Users className="text-secondary" size={20} /> Donor Wall ({campaign.lastDonors?.length || 0})
            </h3>
            
            {campaign.lastDonors?.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl">
                <Gift size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="text-slate-400 text-sm font-semibold">Be the first to donate and support this cause!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {campaign.lastDonors.map((don, idx) => (
                  <Motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={don.createdAt + idx} 
                    className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-rose-50 text-secondary flex items-center justify-center font-black text-sm shrink-0">
                      {don.displayName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-black text-slate-900 text-sm">{don.displayName}</h4>
                        <span className="font-black text-secondary text-sm">${(don.amount / 100).toFixed(2)}</span>
                      </div>
                      {don.message && (
                        <p className="text-slate-500 text-xs font-semibold flex items-start gap-1">
                          <MessageSquare size={12} className="shrink-0 mt-0.5 text-slate-400" />
                          <span>"{don.message}"</span>
                        </p>
                      )}
                      <span className="text-[10px] text-slate-400 font-bold mt-2 block">
                        {new Date(don.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Sticky Sidebar / Donate Panel Right Column ─────────────────────── */}
        <div className="space-y-8 lg:sticky lg:top-24">
          <div className="glass-card p-6 bg-white border-slate-100 shadow-lg">
            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
              <Heart className="text-secondary fill-current" size={18} /> Support this Cause
            </h3>

            {/* Progress detail */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-black text-slate-950">${(campaign.raisedAmount / 100).toLocaleString()}</span>
                <span className="text-xs font-semibold text-slate-400">raised of ${(campaign.goalAmount / 100).toLocaleString()} goal</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-secondary to-accent" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-400">
                <span>{progress.toFixed(0)}% reached</span>
                {daysLeft !== null && (
                  <span className="flex items-center gap-1 text-slate-900">
                    <Clock size={12} /> {daysLeft} days left
                  </span>
                )}
              </div>
            </div>

            {/* Checkout / Donation Form */}
            {canDonate ? (
              <AnimatePresence mode="wait">
                {!clientSecret ? (
                  <Motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* Preset Amount Selection */}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {PRESETS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => { setAmount(p); setIsCustom(false); }}
                          className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                            amount === p && !isCustom
                              ? "bg-secondary text-white border-secondary shadow-sm"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          ${p / 100}
                        </button>
                      ))}
                    </div>

                    {/* Custom Amount */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Custom amount ($)</label>
                      <div className="relative">
                        <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="number"
                          min="1"
                          placeholder="Other amount"
                          value={customAmountInput}
                          onChange={(e) => {
                            setCustomAmountInput(e.target.value);
                            setIsCustom(true);
                          }}
                          className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-sm focus:ring-2 focus:ring-secondary/20 outline-none"
                        />
                      </div>
                    </div>

                    {/* Display name */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Your Display Name</label>
                        <label className="flex items-center gap-1 text-xs text-slate-400 font-bold cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={isAnonymous} 
                            onChange={(e) => setIsAnonymous(e.target.checked)} 
                            className="rounded border-slate-300 text-secondary focus:ring-secondary"
                          />
                          Anonymous
                        </label>
                      </div>
                      <input
                        type="text"
                        placeholder="Anonymous"
                        disabled={isAnonymous}
                        value={isAnonymous ? "" : displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-sm focus:ring-2 focus:ring-secondary/20 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                      />
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Add a message (optional)</label>
                      <textarea
                        rows="2"
                        maxLength="300"
                        placeholder="Leave a message of encouragement..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-sm focus:ring-2 focus:ring-secondary/20 outline-none resize-none"
                      />
                    </div>

                    {paymentError && (
                      <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 text-xs font-semibold">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <p>{paymentError}</p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleInitiateDonation}
                      disabled={creatingIntent}
                      className="w-full py-3.5 rounded-xl font-black text-white bg-gradient-to-br from-secondary to-accent shadow-lg shadow-rose-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 text-sm"
                    >
                      {creatingIntent ? (
                        <>
                          <div className="w-4.5 h-4.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          Securing Stripe...
                        </>
                      ) : (
                        <>
                          <Heart size={16} className="fill-current text-rose-200" />
                          Continue to Payment
                        </>
                      )}
                    </button>
                  </Motion.div>
                ) : (
                  /* ─── Stripe Payment Form Embedded inside desktop sidebar ─── */
                  <Motion.div 
                    initial={{ opacity: 0, scale: 0.98 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    className="border-t border-slate-100 pt-5 mt-5"
                  >
                    <h4 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-1.5 text-secondary">
                      <Lock size={14} /> Finalize stripe contribution
                    </h4>
                    <Elements stripe={stripePromise} options={stripeOptions}>
                      <StripeDonationForm 
                        amountInCents={isCustom ? parseInt(customAmountInput) * 100 : amount}
                        onSuccess={(intentId) => {
                          navigate(`/thank-you?paymentIntent=${intentId}`);
                        }}
                      />
                    </Elements>
                  </Motion.div>
                )}
              </AnimatePresence>
            ) : (
              <div className="p-4 bg-slate-50 text-slate-500 rounded-2xl border border-slate-100 text-center text-xs font-bold space-y-1">
                <AlertCircle className="mx-auto mb-1 text-slate-400" size={20} />
                <p>This campaign has ended.</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Status: {campaign.status}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Mobile Bottom Sheet Modal (Framer Motion Slide-Up) ─────────────── */}
      <AnimatePresence>
        {showPayment && clientSecret && (
          <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
            {/* Backdrop */}
            <Motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPayment(false)}
              className="absolute inset-0 bg-slate-950"
            />
            {/* Slide up sheet */}
            <Motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white rounded-t-[32px] p-6 shadow-2xl border border-slate-100 z-10 space-y-4 max-h-[85vh] overflow-y-auto"
            >
              {/* Drag Handle indicator */}
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-3" />
              
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-1.5 text-secondary">
                  <Heart size={18} className="fill-secondary text-secondary" /> Finalize Donation
                </h3>
                <button 
                  onClick={() => setShowPayment(false)}
                  className="px-2.5 py-1 text-xs font-black text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <Elements stripe={stripePromise} options={stripeOptions}>
                <StripeDonationForm 
                  amountInCents={isCustom ? parseInt(customAmountInput) * 100 : amount}
                  onSuccess={(intentId) => {
                    navigate(`/thank-you?paymentIntent=${intentId}`);
                  }}
                />
              </Elements>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CampaignDetail;
