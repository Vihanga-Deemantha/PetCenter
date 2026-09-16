import React from "react";

const ITEMS = [
  { n: "01", label: "Free delivery over $75" },
  { n: "02", label: "Vet-reviewed listings" },
  { n: "03", label: "30-day easy returns" },
  { n: "04", label: "Secure Stripe checkout" },
];

const ValueStrip = () => (
  <section className="bg-border border-y border-[#ded6c8]">
    <div className="max-w-7xl mx-auto px-7 py-6.5 grid grid-cols-2 md:grid-cols-4 gap-7">
      {ITEMS.map((item) => (
        <div key={item.n} className="flex flex-col gap-1">
          <span className="text-[11px] tracking-[0.14em] uppercase text-accent font-semibold">{item.n}</span>
          <span className="text-sm text-[#3f3f38]">{item.label}</span>
        </div>
      ))}
    </div>
  </section>
);

export default ValueStrip;
