import React, { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { Elements } from "@stripe/react-stripe-js";
import { Lock, ArrowLeft, MapPin } from "lucide-react";
import { stripePromise } from "../utils/stripeConfig";
import { createPaymentIntent } from "../api/checkout.api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import StripeCheckoutForm from "../components/store/StripeCheckoutForm";
import OrderSummary from "../components/store/OrderSummary";
import { formatPrice } from "../utils/priceFormatter";
import { Link } from "react-router-dom";

const COUNTRIES = ["United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Japan", "India", "Sri Lanka", "Other"];

const Checkout = () => {
  const { user } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [serverTotal, setServerTotal] = useState(0);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [intentError, setIntentError] = useState(null);
  const [step, setStep] = useState("address"); // "address" | "payment"

  const [address, setAddress] = useState({
    fullName: user?.name || "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    country: "United States",
    postalCode: "",
  });
  const [addressErrors, setAddressErrors] = useState({});

  if (!user) return <Navigate to="/login" replace />;
  if (cartItems.length === 0) return <Navigate to="/cart" replace />;

  const validateAddress = () => {
    const errs = {};
    if (!address.fullName.trim()) errs.fullName = "Full name is required";
    if (!address.addressLine1.trim()) errs.addressLine1 = "Address is required";
    if (!address.city.trim()) errs.city = "City is required";
    if (!address.postalCode.trim()) errs.postalCode = "Postal code is required";
    setAddressErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinueToPayment = async () => {
    if (!validateAddress()) return;
    setCreatingIntent(true);
    setIntentError(null);
    try {
      const res = await createPaymentIntent(address);
      setClientSecret(res.data.data.clientSecret);
      setPaymentIntentId(res.data.data.paymentIntentId);
      setServerTotal(res.data.data.totalAmount);
      setStep("payment");
    } catch (err) {
      setIntentError(err.response?.data?.message || "Failed to initialize payment. Please try again.");
    }
    setCreatingIntent(false);
  };

  const handlePaymentSuccess = async (intentId) => {
    await clearCart();
    navigate(`/order-success?paymentIntent=${intentId}`);
  };

  const stripeOptions = clientSecret ? {
    clientSecret,
    appearance: {
      theme: "stripe",
      variables: {
        colorPrimary: "#6366f1",
        borderRadius: "12px",
        fontFamily: "Outfit, sans-serif",
      },
    },
  } : null;

  return (
    <div>
      {/* Header */}
      <Motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <Link to="/cart" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors mb-4">
          <ArrowLeft size={16} /> Back to Cart
        </Link>
        <h1 className="text-4xl font-black tracking-tighter text-slate-900">Checkout</h1>

        {/* Steps */}
        <div className="flex items-center gap-3 mt-4">
          {["address", "payment"].map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 text-sm font-bold ${step === s ? "text-primary" : "text-slate-400"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${step === s ? "bg-primary text-white" : "bg-slate-100 text-slate-400"}`}>{i + 1}</div>
                {s === "address" ? "Shipping" : "Payment"}
              </div>
              {i === 0 && <div className="flex-1 h-0.5 bg-slate-100 max-w-8" />}
            </React.Fragment>
          ))}
        </div>
      </Motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: Address / Payment Form */}
        <div className="lg:col-span-2">
          {step === "address" && (
            <Motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card bg-white border-slate-100 shadow-sm p-8 space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <MapPin size={20} className="text-primary" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Shipping Address</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Full Name *</label>
                  <input
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border font-semibold text-sm text-slate-800 focus:ring-2 focus:ring-primary/20 outline-none bg-white ${addressErrors.fullName ? "border-rose-400" : "border-slate-200"}`}
                    placeholder="John Smith"
                  />
                  {addressErrors.fullName && <p className="text-xs text-rose-500 font-bold mt-1">{addressErrors.fullName}</p>}
                </div>

                {/* Address Line 1 */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Address *</label>
                  <input
                    value={address.addressLine1}
                    onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border font-semibold text-sm text-slate-800 focus:ring-2 focus:ring-primary/20 outline-none bg-white ${addressErrors.addressLine1 ? "border-rose-400" : "border-slate-200"}`}
                    placeholder="123 Main Street"
                  />
                  {addressErrors.addressLine1 && <p className="text-xs text-rose-500 font-bold mt-1">{addressErrors.addressLine1}</p>}
                </div>

                {/* Address Line 2 */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Apt, Suite, etc. (optional)</label>
                  <input
                    value={address.addressLine2}
                    onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 font-semibold text-sm text-slate-800 focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                    placeholder="Apt 4B"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">City *</label>
                  <input
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border font-semibold text-sm text-slate-800 focus:ring-2 focus:ring-primary/20 outline-none bg-white ${addressErrors.city ? "border-rose-400" : "border-slate-200"}`}
                    placeholder="New York"
                  />
                  {addressErrors.city && <p className="text-xs text-rose-500 font-bold mt-1">{addressErrors.city}</p>}
                </div>

                {/* Postal Code */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Postal Code *</label>
                  <input
                    value={address.postalCode}
                    onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border font-semibold text-sm text-slate-800 focus:ring-2 focus:ring-primary/20 outline-none bg-white ${addressErrors.postalCode ? "border-rose-400" : "border-slate-200"}`}
                    placeholder="10001"
                  />
                  {addressErrors.postalCode && <p className="text-xs text-rose-500 font-bold mt-1">{addressErrors.postalCode}</p>}
                </div>

                {/* Country */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Country *</label>
                  <select
                    value={address.country}
                    onChange={(e) => setAddress({ ...address, country: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 font-semibold text-sm text-slate-800 focus:ring-2 focus:ring-primary/20 outline-none bg-white cursor-pointer"
                  >
                    {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {intentError && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-700 font-bold">{intentError}</div>
              )}

              <button
                onClick={handleContinueToPayment}
                disabled={creatingIntent}
                className="w-full py-4 rounded-xl font-black text-white bg-gradient-to-br from-primary to-accent shadow-lg shadow-indigo-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {creatingIntent ? (
                  <><div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> Initializing...</>
                ) : (
                  <><Lock size={18} /> Continue to Payment</>
                )}
              </button>
            </Motion.div>
          )}

          {step === "payment" && clientSecret && (
            <Motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card bg-white border-slate-100 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Lock size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Secure Payment</h2>
                  <p className="text-xs text-slate-400 font-medium">256-bit SSL encryption</p>
                </div>
              </div>

              <Elements stripe={stripePromise} options={stripeOptions}>
                <StripeCheckoutForm
                  onSuccess={handlePaymentSuccess}
                  totalAmount={formatPrice(serverTotal)}
                />
              </Elements>

              <button onClick={() => setStep("address")} className="mt-4 text-sm font-bold text-slate-400 hover:text-primary transition-colors flex items-center gap-1">
                <ArrowLeft size={14} /> Edit shipping address
              </button>
            </Motion.div>
          )}
        </div>

        {/* Right: Order Summary */}
        <div>
          <OrderSummary items={cartItems} total={serverTotal || cartTotal} title="Order Summary" />
        </div>
      </div>
    </div>
  );
};

export default Checkout;
