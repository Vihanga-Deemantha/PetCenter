import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { motion as Motion } from "framer-motion";

const FAQS = [
  {
    q: "How do I list a pet for sale or adoption?",
    a: (
      <>
        Go to <Link to="/create-listing">Create Listing</Link>, fill in the details (species, breed,
        age, photos, and price if selling), and submit. New listings are reviewed before they go
        live on the marketplace.
      </>
    ),
  },
  {
    q: "How does the Ecosystem Builder work?",
    a: (
      <>
        Pick a pet type from the <Link to="/ecosystem">Ecosystem Builder</Link>, and it walks you
        through the essential and optional supplies for that habitat — tank size, filtration,
        substrate, and more — then adds everything to your cart in one step.
      </>
    ),
  },
  {
    q: "How do I contact a seller or shelter?",
    a: "Open the listing or shelter page and tap \"Reveal Contact.\" You'll need to be signed in — this keeps contact details from being scraped by bots.",
  },
  {
    q: "Where's my order?",
    a: (
      <>
        Check <Link to="/orders">Order History</Link> for real-time status. You'll also get a
        notification (bell icon, top right) whenever your order's status changes.
      </>
    ),
  },
  {
    q: "Can I cancel an order?",
    a: 'Yes — from Order Detail, orders that are still "pending" or "processing" can be cancelled for a full refund to your original payment method.',
  },
  {
    q: "How do reviews work?",
    a: "Only customers with a delivered order for that exact product can leave a review, so every review on PetCenter is from a verified purchase. You can edit your review within 48 hours of posting.",
  },
  {
    q: "How do I save items for later?",
    a: (
      <>
        Tap the heart icon on any pet or product to save it — view everything you've saved under{" "}
        <Link to="/favorites">Favorites</Link>.
      </>
    ),
  },
  {
    q: "Is my payment information safe?",
    a: "Yes. All payments are processed by Stripe — PetCenter never stores your full card number.",
  },
];

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 py-5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-left gap-4"
      >
        <span className="font-black text-slate-900">{q}</span>
        <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <Motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="text-slate-500 font-medium mt-3 leading-relaxed"
        >
          {a}
        </Motion.p>
      )}
    </div>
  );
};

const Help = () => (
  <div className="max-w-3xl mx-auto">
    <div className="mb-12">
      <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-[11px] font-black uppercase tracking-widest border border-primary/10">
        Help Center
      </span>
      <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 mt-4 mb-3">
        How can we help?
      </h1>
      <p className="text-slate-500 text-lg font-medium">
        Answers to the most common questions about buying, selling, and using PetCenter.
      </p>
    </div>

    <div>
      {FAQS.map((faq) => (
        <FaqItem key={faq.q} {...faq} />
      ))}
    </div>

    <div className="mt-12 p-8 bg-slate-50 rounded-3xl text-center">
      <p className="font-black text-slate-900 mb-2">Still stuck?</p>
      <p className="text-slate-500 font-medium mb-5">Our team is happy to help with anything not covered here.</p>
      <Link to="/contact" className="btn btn-primary px-8 inline-flex">Contact Support</Link>
    </div>
  </div>
);

export default Help;
