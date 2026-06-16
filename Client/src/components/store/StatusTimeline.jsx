import React from "react";
import { CheckCircle, Clock, Truck, Package, XCircle } from "lucide-react";

const STEPS = [
  { key: "processing", label: "Processing", icon: Clock, desc: "Order confirmed & being prepared" },
  { key: "shipped", label: "Shipped", icon: Truck, desc: "Package is on its way" },
  { key: "delivered", label: "Delivered", icon: Package, desc: "Order delivered successfully" },
];

const StatusTimeline = ({ status }) => {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-2xl border border-rose-100">
        <XCircle className="text-rose-500" size={24} />
        <div>
          <p className="font-black text-rose-700">Order Cancelled</p>
          <p className="text-xs text-rose-500 font-medium">This order has been cancelled</p>
        </div>
      </div>
    );
  }

  const stepOrder = ["processing", "shipped", "delivered"];
  const currentIndex = stepOrder.indexOf(status);

  return (
    <div className="relative">
      {/* Connector line */}
      <div className="absolute top-6 left-6 right-6 h-0.5 bg-slate-100" style={{ marginLeft: "24px", marginRight: "24px", left: "48px", right: "48px" }} />

      <div className="flex justify-between relative z-10">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = isCompleted ? CheckCircle : step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center gap-2 flex-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isCompleted ? "bg-emerald-500 shadow-lg shadow-emerald-500/30"
                : isCurrent ? "bg-primary shadow-lg shadow-primary/30"
                : "bg-slate-100"
              }`}>
                <Icon
                  size={20}
                  className={isCompleted ? "text-white" : isCurrent ? "text-white" : "text-slate-400"}
                />
              </div>
              <div className="text-center">
                <p className={`text-xs font-black ${
                  isCompleted ? "text-emerald-600"
                  : isCurrent ? "text-primary"
                  : "text-slate-400"
                }`}>
                  {step.label}
                </p>
                <p className="text-[10px] text-slate-400 font-medium hidden sm:block">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusTimeline;
