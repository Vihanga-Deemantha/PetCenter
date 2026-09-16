import React, { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Home, Share2 } from "lucide-react";
import confetti from "canvas-confetti";

const ThankYou = () => {
  const [searchParams] = useSearchParams();
  const paymentIntentId = searchParams.get("paymentIntent");

  useEffect(() => {
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#C87550", "#78866F", "#4F5B4B"] });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#C87550", "#78866F", "#4F5B4B"] });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-7 min-h-[75vh] flex items-center justify-center py-12">
      <Motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", damping: 20 }} className="max-w-xl w-full text-center">
        <Motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          className="inline-flex items-center justify-center w-16.5 h-16.5 rounded-full bg-[#F7E9DF] mb-7"
        >
          <CheckCircle2 size={30} className="text-primary" />
        </Motion.span>

        <h1 className="font-heading text-[38px] sm:text-[46px] font-medium tracking-tight mb-3">Thank you</h1>
        <p className="text-[#5c5c54] text-[15.5px] leading-relaxed mb-6">
          Your donation has gone straight to this cause. A receipt is on its way to your inbox, and the shelter will post updates as things progress.
        </p>

        {paymentIntentId && (
          <div className="inline-block p-3.5 bg-white rounded-xl border border-border font-mono text-xs text-[#8a8a80] mb-8 select-all">Payment ID: {paymentIntentId}</div>
        )}

        <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center">
          <Link to="/campaigns" className="btn btn-primary px-7 py-3.5 w-full sm:w-auto">
            Browse other causes <ArrowRight size={15} />
          </Link>
          <Link to="/" className="btn border border-[#cfc8ba] text-secondary hover:bg-border px-7 py-3.5 w-full sm:w-auto">
            <Home size={15} /> Back to home
          </Link>
        </div>

        <button
          onClick={() => navigator.clipboard?.writeText(window.location.origin + "/campaigns")}
          className="mt-6 inline-flex items-center gap-1.5 text-[13px] text-[#8a8a80] hover:text-primary transition-colors"
        >
          <Share2 size={13} /> Copy link to share
        </button>
      </Motion.div>
    </div>
  );
};

export default ThankYou;
