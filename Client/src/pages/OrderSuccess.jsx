import React, { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { CheckCircle, Package, ArrowRight, ShoppingBag } from "lucide-react";
import confetti from "canvas-confetti";

const OrderSuccess = () => {
  const [params] = useSearchParams();
  const paymentIntentId = params.get("paymentIntent");

  useEffect(() => {
    // Celebration confetti burst
    const fire = (particleRatio, opts) => {
      confetti(Object.assign({}, {
        origin: { y: 0.6 },
        disableForReducedMotion: true,
      }, opts, { particleCount: Math.floor(200 * particleRatio) }));
    };

    // Try canvas-confetti if available, otherwise skip gracefully
    try {
      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    } catch { /* confetti not available */ }
  }, []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="text-center max-w-lg mx-auto"
      >
        {/* Success Icon */}
        <Motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
          className="inline-flex items-center justify-center w-28 h-28 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-[36px] shadow-2xl shadow-emerald-500/30 mb-8"
        >
          <CheckCircle size={56} className="text-white" />
        </Motion.div>

        <Motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 mb-3"
        >
          Order Confirmed! 🎉
        </Motion.h1>

        <Motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-slate-500 font-medium text-lg mb-4"
        >
          Thank you for your purchase. We're preparing your order now!
        </Motion.p>

        {paymentIntentId && (
          <Motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xs font-mono text-slate-400 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 mb-8"
          >
            Payment ID: {paymentIntentId}
          </Motion.p>
        )}

        {/* What's Next */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card bg-white border-slate-100 shadow-sm p-6 mb-8 text-left space-y-4"
        >
          <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">What happens next?</h3>
          {[
            { icon: "📦", title: "Order Processing", desc: "We're packing your items carefully." },
            { icon: "🚚", title: "Shipping", desc: "Your order will be shipped within 1-2 business days." },
            { icon: "📬", title: "Delivery", desc: "You'll receive tracking information via email." },
          ].map((step) => (
            <div key={step.title} className="flex items-start gap-3">
              <span className="text-2xl">{step.icon}</span>
              <div>
                <p className="font-black text-slate-900 text-sm">{step.title}</p>
                <p className="text-xs text-slate-500 font-medium">{step.desc}</p>
              </div>
            </div>
          ))}
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link to="/orders" className="btn btn-primary px-8 py-3">
            <Package size={18} /> View My Orders
          </Link>
          <Link to="/products" className="btn bg-slate-100 text-slate-700 hover:bg-slate-200 px-8 py-3">
            <ShoppingBag size={18} /> Continue Shopping
          </Link>
        </Motion.div>
      </Motion.div>
    </div>
  );
};

export default OrderSuccess;
