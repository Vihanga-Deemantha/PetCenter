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
      confirmParams: { return_url: `${window.location.origin}/thank-you` },
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
      <div className="bg-light rounded-2xl border border-border p-4">
        <PaymentElement options={{ layout: "tabs", defaultValues: { billingDetails: { address: { country: "US" } } } }} />
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3.5 bg-[#F7E9DF] text-[#8f4a28] rounded-xl">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p className="text-sm font-medium m-0">{error}</p>
        </div>
      )}

      <button type="submit" disabled={!stripe || processing} className="btn btn-primary w-full py-3.75 text-base disabled:opacity-60 disabled:cursor-not-allowed">
        {processing ? (
          <>
            <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            Completing donation...
          </>
        ) : (
          <>
            <Heart size={17} className="fill-current" />
            Donate ${amountInDollars} now
          </>
        )}
      </button>

      <p className="text-center text-[11px] text-[#8a8a80] font-medium flex items-center justify-center gap-1.5">
        <Lock size={10} /> Secured by Stripe. Thank you for your support!
      </p>
    </form>
  );
};

export default StripeDonationForm;
