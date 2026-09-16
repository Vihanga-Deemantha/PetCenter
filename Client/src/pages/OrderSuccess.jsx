import React, { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { CheckCircle, Package, ArrowRight, ShoppingBag } from "lucide-react";
import confetti from "canvas-confetti";
import CheckoutSteps from "../components/store/CheckoutSteps";

const OrderSuccess = () => {
  const [params] = useSearchParams();
  const paymentIntentId = params.get("paymentIntent");

  useEffect(() => {
    const fire = (particleRatio, opts) => {
      confetti(
        Object.assign(
          {},
          { origin: { y: 0.6 }, disableForReducedMotion: true, colors: ["#C87550", "#78866F", "#4F5B4B", "#E8E2D8"] },
          opts,
          { particleCount: Math.floor(200 * particleRatio) }
        )
      );
    };
    try {
      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    } catch {
      /* confetti not available */
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-7 pt-7 pb-24">
      <CheckoutSteps current="done" />

      <Motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }} className="max-w-xl mx-auto text-center py-6">
        <Motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
          className="inline-flex items-center justify-center w-16.5 h-16.5 rounded-full bg-[#E9EDE4] mb-6"
        >
          <CheckCircle size={30} className="text-[#40543C]" />
        </Motion.span>

        <Motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="font-heading text-[36px] sm:text-[44px] font-medium tracking-tight mb-3">
          Order confirmed
        </Motion.h1>

        <Motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-[#5c5c54] text-[15.5px] leading-relaxed mb-1">
          Thank you for your purchase — we're preparing your order now.
        </Motion.p>

        {paymentIntentId && (
          <Motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-xs font-mono text-[#8a8a80] bg-light px-4 py-2 rounded-xl border border-border inline-block mt-4 mb-2">
            Payment ID: {paymentIntentId}
          </Motion.p>
        )}

        <Motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white border border-[#E8E2D8] rounded-[22px] p-7 mt-6 mb-8 text-left space-y-4">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-wider text-[#8a8a7e]">What happens next</p>
          {[
            { icon: "📦", title: "Order processing", desc: "We're packing your items carefully." },
            { icon: "🚚", title: "Shipping", desc: "Your order ships within 1–2 business days." },
            { icon: "📬", title: "Delivery", desc: "You'll receive tracking information by email." },
          ].map((step) => (
            <div key={step.title} className="flex items-start gap-3.5">
              <span className="text-xl leading-none mt-0.5">{step.icon}</span>
              <div>
                <p className="font-semibold text-[#292925] text-sm m-0">{step.title}</p>
                <p className="text-[13px] text-[#6e6e64] m-0 mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </Motion.div>

        <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex flex-col sm:flex-row gap-3.5 justify-center">
          <Link to="/dashboard?tab=orders" className="btn btn-primary px-7 py-3.5">
            <Package size={17} /> View my orders
          </Link>
          <Link to="/products" className="btn border border-[#cfc8ba] text-secondary hover:bg-border px-7 py-3.5">
            <ShoppingBag size={17} /> Continue shopping <ArrowRight size={15} />
          </Link>
        </Motion.div>
      </Motion.div>
    </div>
  );
};

export default OrderSuccess;
