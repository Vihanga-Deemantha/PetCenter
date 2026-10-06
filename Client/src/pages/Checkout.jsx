import React, { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { Elements } from "@stripe/react-stripe-js";
import { Lock, ArrowLeft, MapPin } from "lucide-react";
import { stripePromise } from "../utils/stripeConfig";
import { createPaymentIntent, confirmPayment } from "../api/checkout.api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import StripeCheckoutForm from "../components/store/StripeCheckoutForm";
import OrderSummary from "../components/store/OrderSummary";
import CheckoutSteps from "../components/store/CheckoutSteps";
import { formatPrice } from "../utils/priceFormatter";

const COUNTRIES = ["United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Japan", "India", "Sri Lanka", "Other"];

const fieldCls = (hasError) => `border rounded-2xl px-4 py-3.25 text-sm text-[#292925] bg-light outline-none transition-colors ${hasError ? "border-[#d79274]" : "border-border focus:border-accent"}`;

const Checkout = () => {
  const { user } = useAuth();
  const { cartItems, cartTotal, clearLocalCartOnly } = useCart();
  const navigate = useNavigate();

  const [clientSecret, setClientSecret] = useState(null);
  const [serverTotal, setServerTotal] = useState(0);
  const [serverSubtotal, setServerSubtotal] = useState(0);
  const [serverShippingFee, setServerShippingFee] = useState(null);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [intentError, setIntentError] = useState(null);
  const [step, setStep] = useState("address"); // "address" | "payment"
  const [finalizingOrder, setFinalizingOrder] = useState(false);

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
  if (cartItems.length === 0 && !finalizingOrder) return <Navigate to="/cart" replace />;

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
      setServerTotal(res.data.data.totalAmount);
      setServerSubtotal(res.data.data.subtotal);
      setServerShippingFee(res.data.data.shippingFee);
      setStep("payment");
    } catch (err) {
      setIntentError(err.response?.data?.message || "Failed to initialize payment. Please try again.");
    }
    setCreatingIntent(false);
  };

  const handlePaymentSuccess = async (intentId) => {
    setFinalizingOrder(true);
    try {
      const response = await confirmPayment(intentId);
      const orderId = response.data.data.order?._id;
      clearLocalCartOnly();
      navigate(`/order-success?paymentIntent=${intentId}&orderId=${orderId}`, { replace: true });
    } catch (error) {
      setFinalizingOrder(false);
      throw error;
    }
  };

  const stripeOptions = clientSecret
    ? {
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#C87550",
            colorBackground: "#ffffff",
            colorText: "#292925",
            borderRadius: "14px",
            fontFamily: "Inter, sans-serif",
          },
        },
      }
    : null;

  return (
    <div className="max-w-7xl mx-auto px-7 pt-7 pb-24">
      <CheckoutSteps current="shipping" itemLabel={`${cartItems.length} item${cartItems.length !== 1 ? "s" : ""}`} />

      <Motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-heading text-[36px] sm:text-[44px] font-medium tracking-tight mb-2">Shipping and payment</h1>
        <p className="text-[15px] text-[#5c5c54]">Live animals are never shipped — this is for supplies and habitat kits only.</p>
      </Motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.62fr_1fr] gap-9 items-start">
        <div>
          {step === "address" && (
            <Motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="bg-white border border-[#E8E2D8] rounded-[22px] p-7 sm:p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                  <MapPin size={19} className="text-accent" />
                </div>
                <h2 className="font-heading text-xl font-medium">Delivery address</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
                <div className="sm:col-span-2 flex flex-col gap-1.75">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#8a8a7e]">Full name *</label>
                  <input value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} className={fieldCls(addressErrors.fullName)} placeholder="John Smith" />
                  {addressErrors.fullName && <p className="text-xs text-[#b4573a] font-medium m-0">{addressErrors.fullName}</p>}
                </div>

                <div className="sm:col-span-2 flex flex-col gap-1.75">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#8a8a7e]">Address *</label>
                  <input value={address.addressLine1} onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })} className={fieldCls(addressErrors.addressLine1)} placeholder="123 Main Street" />
                  {addressErrors.addressLine1 && <p className="text-xs text-[#b4573a] font-medium m-0">{addressErrors.addressLine1}</p>}
                </div>

                <div className="sm:col-span-2 flex flex-col gap-1.75">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#8a8a7e]">Apt, suite, etc. (optional)</label>
                  <input value={address.addressLine2} onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })} className={fieldCls(false)} placeholder="Apt 4B" />
                </div>

                <div className="flex flex-col gap-1.75">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#8a8a7e]">City *</label>
                  <input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className={fieldCls(addressErrors.city)} placeholder="New York" />
                  {addressErrors.city && <p className="text-xs text-[#b4573a] font-medium m-0">{addressErrors.city}</p>}
                </div>

                <div className="flex flex-col gap-1.75">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#8a8a7e]">Postal code *</label>
                  <input value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} className={fieldCls(addressErrors.postalCode)} placeholder="10001" />
                  {addressErrors.postalCode && <p className="text-xs text-[#b4573a] font-medium m-0">{addressErrors.postalCode}</p>}
                </div>

                <div className="sm:col-span-2 flex flex-col gap-1.75">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#8a8a7e]">Country *</label>
                  <select value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} className={`${fieldCls(false)} cursor-pointer`}>
                    {COUNTRIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {intentError && <div className="p-3.5 bg-[#F7E9DF] border border-[#F0D9C8] rounded-xl text-sm text-[#8f4a28] font-medium">{intentError}</div>}

              <button onClick={handleContinueToPayment} disabled={creatingIntent} className="btn btn-primary w-full py-3.75 disabled:opacity-60">
                {creatingIntent ? (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Initializing...
                  </>
                ) : (
                  <>
                    <Lock size={17} /> Continue to payment
                  </>
                )}
              </button>
            </Motion.div>
          )}

          {step === "payment" && clientSecret && (
            <Motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="bg-white border border-[#E8E2D8] rounded-[22px] p-7 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                  <Lock size={19} className="text-accent" />
                </div>
                <div>
                  <h2 className="font-heading text-xl font-medium">Payment</h2>
                  <p className="text-xs text-[#8a8a7e]">Card details are never stored. Payments settle through Stripe.</p>
                </div>
              </div>

              <Elements stripe={stripePromise} options={stripeOptions}>
                <StripeCheckoutForm onSuccess={handlePaymentSuccess} totalAmount={formatPrice(serverTotal)} />
              </Elements>

              <button onClick={() => setStep("address")} className="mt-4 text-sm font-medium text-[#8a8a80] hover:text-primary transition-colors flex items-center gap-1.5">
                <ArrowLeft size={14} /> Edit delivery address
              </button>
            </Motion.div>
          )}

          <Link to="/cart" className="inline-block mt-5 text-[13.5px] text-[#6e6e64] hover:text-primary transition-colors">
            Back to cart
          </Link>
        </div>

        <div className="lg:sticky lg:top-28">
          <OrderSummary
            items={cartItems}
            subtotal={serverSubtotal || cartTotal}
            shippingFee={step === "payment" ? serverShippingFee : undefined}
            title="Order summary"
          />
        </div>
      </div>
    </div>
  );
};

export default Checkout;
