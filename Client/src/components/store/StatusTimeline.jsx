import React from "react";
import { CheckCircle, Clock, Truck, Package, XCircle } from "lucide-react";

const STEPS = [
  { key: "processing", label: "Processing", icon: Clock, desc: "Order confirmed & being prepared" },
  { key: "shipped", label: "Shipped", icon: Truck, desc: "Package is on its way" },
  { key: "delivered", label: "Delivered", icon: Package, desc: "Order delivered successfully" },
];

// statusHistory entries only exist for orders placed (or transitioned)
// after this was added — older orders simply have none, and every date
// below falls back to the generic step description rather than guessing.
const StatusTimeline = ({ status, statusHistory = [] }) => {
  const dateFor = (stepKey) => {
    const entry = statusHistory.find((h) => h.status === stepKey);
    return entry ? new Date(entry.changedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null;
  };

  if (status === "cancelled") {
    const cancelledDate = dateFor("cancelled");
    return (
      <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-2xl border border-rose-100">
        <XCircle className="text-rose-500" size={24} />
        <div>
          <p className="font-semibold text-rose-700">Order cancelled</p>
          <p className="text-xs text-rose-500 font-medium">{cancelledDate ? `Cancelled ${cancelledDate}` : "This order has been cancelled"}</p>
        </div>
      </div>
    );
  }

  const stepOrder = ["processing", "shipped", "delivered"];
  // "pending" (order accepted, not yet confirmed) has no step of its own in
  // this 3-step timeline — indexOf would return -1, which matched none of
  // the isCompleted/isCurrent checks below and rendered every circle as
  // inactive with no indication of progress at all. Treat it as "Processing"
  // hasn't started yet but is the active/current step, same as the customer
  // would expect to see.
  const currentIndex = status === "pending" ? 0 : stepOrder.indexOf(status);

  return (
    <div className="relative">
      {/* Connector line */}
      <div className="absolute top-6 h-0.5 bg-border" style={{ left: "48px", right: "48px" }} />

      <div className="flex justify-between relative z-10">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = isCompleted ? CheckCircle : step.icon;
          const date = (isCompleted || isCurrent) && dateFor(step.key);

          return (
            <div key={step.key} className="flex flex-col items-center gap-2 flex-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isCompleted ? "bg-secondary"
                : isCurrent ? "bg-primary"
                : "bg-border"
              }`}>
                <Icon
                  size={20}
                  className={isCompleted || isCurrent ? "text-white" : "text-[#a8a49a]"}
                />
              </div>
              <div className="text-center">
                <p className={`text-xs font-semibold ${
                  isCompleted ? "text-secondary"
                  : isCurrent ? "text-primary"
                  : "text-[#a8a49a]"
                }`}>
                  {step.label}
                </p>
                <p className="text-[10px] text-[#8a8a80] font-medium hidden sm:block">{date || step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusTimeline;
