import React, { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Lock, AlertCircle, Heart } from "lucide-react";

const StripeDonationForm = ({ onSuccess, amountInCents }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || processing) return;

    setProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message);
      setProcessing(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/thank-you`,
      },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message);
      setProcessing(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess?.(paymentIntent.id);
    } else {
      setError("Donation payment was not completed. Please try again.");
      setProcessing(false);
    }
  };

  const amountInDollars = (amountInCents / 100).toFixed(2);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4">
        <PaymentElement
          options={{
            layout: "tabs",
            defaultValues: { billingDetails: { address: { country: "US" } } },
          }}
        />
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-100">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full py-4 rounded-xl font-black text-white bg-gradient-to-br from-primary to-accent shadow-lg shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-base cursor-pointer"
      >
        {processing ? (
          <>
            <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            Completing donation...
          </>
        ) : (
          <>
            <Heart size={18} className="fill-current text-rose-200 animate-pulse" />
            Donate ${amountInDollars} Now
          </>
        )}
      </button>

      <p className="text-center text-[10px] text-slate-400 font-semibold flex items-center justify-center gap-1.5">
        <Lock size={10} /> Secured by Stripe. Thank you for your support!
      </p>
    </form>
  );
};

export default StripeDonationForm;
