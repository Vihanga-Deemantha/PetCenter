import React from "react";
import { Link } from "react-router-dom";

const STEPS = [
  { key: "cart", label: "Cart", path: "/cart" },
  { key: "shipping", label: "Shipping and payment", path: "/checkout" },
  { key: "done", label: "Confirmed", path: null },
];

// Purely visual continuity across the three separate routes (Cart →
// Checkout → OrderSuccess) — not a real multi-step form, so only completed
// steps behind the current one are clickable.
const CheckoutSteps = ({ current, itemLabel }) => {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center gap-3.5 flex-wrap mb-7.5">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const circle = (
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-[12.5px] font-semibold shrink-0 ${
              i <= currentIndex ? "bg-secondary text-light" : "bg-border text-[#8a8a7e]"
            }`}
          >
            {i + 1}
          </span>
        );
        const label = <span className={`text-[13.5px] font-medium whitespace-nowrap ${active ? "text-[#292925]" : "text-[#6e6e64]"}`}>{step.label}</span>;

        return (
          <React.Fragment key={step.key}>
            {done && step.path ? (
              <Link to={step.path} className="flex items-center gap-2.5">
                {circle}
                {label}
              </Link>
            ) : (
              <div className="flex items-center gap-2.5">
                {circle}
                {label}
              </div>
            )}
            {i < STEPS.length - 1 && <span className="w-9.5 h-px bg-[#ded6c8] shrink-0" />}
          </React.Fragment>
        );
      })}
      {itemLabel && <span className="text-[12.5px] text-[#8a8a7e] ml-auto">{itemLabel}</span>}
    </div>
  );
};

export default CheckoutSteps;
