import React from "react";
import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const LowStockAlert = ({ products = [] }) => {
  if (!products || products.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle size={16} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-amber-800 text-sm mb-2">
            {products.length} product{products.length > 1 ? "s" : ""} running low on stock
          </p>
          <div className="space-y-1">
            {products.slice(0, 5).map((p) => (
              <div key={p._id} className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-amber-700 truncate">{p.name}</span>
                <span className={`text-[11px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                  p.stock === 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {p.stock === 0 ? "Out of Stock" : `${p.stock} left`}
                </span>
              </div>
            ))}
          </div>
          {products.length > 5 && (
            <p className="text-[11px] text-amber-600 font-bold mt-2">+{products.length - 5} more...</p>
          )}
          <Link
            to="/admin/products"
            className="inline-flex items-center gap-1 mt-3 text-xs font-black text-amber-700 hover:text-amber-900 underline underline-offset-2"
          >
            Manage Products →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LowStockAlert;
