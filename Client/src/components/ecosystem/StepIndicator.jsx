import React from "react";
import { Check } from "lucide-react";

const STEPS = ["Pick pet", "Review requirements", "Build setup"];

const StepIndicator = ({ currentStep }) => (
  <div className="flex items-center bg-white border border-border rounded-2xl px-5 py-3.5 mb-7">
    {STEPS.map((label, i) => {
      const step = i + 1;
      const isActive = step === currentStep;
      const isDone = step < currentStep;
      return (
        <React.Fragment key={step}>
          <div className="flex items-center gap-2">
            <div
              className={`w-6.5 h-6.5 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 ${
                isActive ? "bg-secondary text-light" : isDone ? "bg-accent text-light" : "bg-border text-[#8a8a80]"
              }`}
            >
              {isDone ? <Check size={12} strokeWidth={3} /> : step}
            </div>
            <span className={`text-[13px] whitespace-nowrap ${isActive ? "font-semibold text-secondary" : isDone ? "font-medium text-accent" : "text-[#8a8a80]"}`}>{label}</span>
          </div>
          {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-3 ${isDone ? "bg-accent" : "bg-border"}`} />}
        </React.Fragment>
      );
    })}
  </div>
);

export default StepIndicator;
