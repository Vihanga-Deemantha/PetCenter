import React, { useState } from "react";
import { motion as Motion } from "framer-motion";

// Decorative signup only — there is no email-marketing backend to wire this
// to, matching the mockup's own trivial client-side "subscribed" toggle.
const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
  };

  return (
    <section className="max-w-7xl mx-auto px-7 mt-24 mb-24">
      <Motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-accent text-light rounded-[28px] px-9 sm:px-14 py-13 grid grid-cols-1 lg:grid-cols-2 gap-11 items-center"
      >
        <div>
          <h2 className="font-heading text-[30px] sm:text-[40px] font-medium mb-3 tracking-tight">A quiet letter, twice a month</h2>
          <p className="m-0 text-base leading-relaxed text-[#EDEFE8]">
            Care notes, new arrivals, and the shelters we're supporting. No noise, unsubscribe anytime.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2.5 flex-wrap">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 min-w-50 border-none rounded-full px-5.5 py-4 text-[15px] bg-light text-[#292925] outline-none"
          />
          <button type="submit" className="btn bg-primary text-white hover:bg-primary-dark px-7.5 py-4">
            {subscribed ? "Thank you" : "Subscribe"}
          </button>
        </form>
      </Motion.div>
    </section>
  );
};

export default NewsletterSection;
