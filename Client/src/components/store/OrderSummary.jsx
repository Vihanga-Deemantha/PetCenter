import React from "react";
import { Package } from "lucide-react";
import { formatPrice } from "../../utils/priceFormatter";

const OrderSummary = ({ items = [], total = 0, title = "Order Summary", children }) => {
  return (
    <div className="glass-card bg-white border-slate-100 shadow-sm p-6 space-y-4">
      <h3 className="font-black text-slate-900 text-lg">{title}</h3>

      {/* Items */}
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {items.map((item, idx) => (
          <div key={item.productId || idx} className="flex gap-3 items-center">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0">
              {item.product?.image?.url || item.image?.url ? (
                <img
                  src={item.product?.image?.url || item.image?.url}
                  alt={item.product?.name || item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package size={18} className="text-slate-300" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-900 line-clamp-1">
                {item.product?.name || item.name}
              </p>
              <p className="text-xs text-slate-400 font-bold">
                {formatPrice(item.priceAtAdd || item.priceAtPurchase)} × {item.quantity}
              </p>
            </div>
            <p className="text-sm font-black text-slate-900 shrink-0">
              {formatPrice((item.priceAtAdd || item.priceAtPurchase) * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 pt-4 space-y-2">
        <div className="flex justify-between text-sm font-bold text-slate-600">
          <span>Subtotal</span>
          <span>{formatPrice(total)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold text-emerald-600">
          <span>Shipping</span>
          <span>Free</span>
        </div>
        <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100">
          <span>Total</span>
          <span className="text-primary">{formatPrice(total)}</span>
        </div>
      </div>

      {/* Slot for additional content (e.g., checkout button) */}
      {children}
    </div>
  );
};

export default OrderSummary;
