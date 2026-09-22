import React from "react";
import { Package } from "lucide-react";
import { formatPrice } from "../../utils/priceFormatter";
import { estimateShippingFee } from "../../utils/shipping";

// `shippingFee` is optional: pass the server's authoritative value once
// known (post-checkout-intent); otherwise this estimates it from the same
// threshold the server uses, so the Cart page's preview never claims a flat
// "Free" that the real charge won't honor.
const OrderSummary = ({ items = [], subtotal = 0, shippingFee, title = "Order summary", children }) => {
  const fee = shippingFee ?? estimateShippingFee(subtotal);
  const total = subtotal + fee;

  return (
    <div className="bg-white border border-[#E8E2D8] rounded-[22px] p-6.5">
      <p className="m-0 mb-4.5 text-[11px] tracking-[0.14em] uppercase text-accent font-semibold">{title}</p>

      <div className="flex flex-col gap-3.5 max-h-72 overflow-y-auto pr-1">
        {items.map((item, idx) => (
          <div key={item.productId || idx} className="flex gap-3 items-center">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-light border border-border shrink-0">
              {item.product?.image?.url || item.image?.url ? (
                <img src={item.product?.image?.url || item.image?.url} alt={item.product?.name || item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package size={16} className="text-[#c9c2b3]" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#292925] line-clamp-1 m-0">{item.product?.name || item.name}</p>
              <p className="text-xs text-[#8a8a80] m-0 mt-0.5">
                {formatPrice(item.priceAtAdd || item.priceAtPurchase)} × {item.quantity}
              </p>
            </div>
            <p className="text-sm font-semibold text-[#292925] shrink-0">{formatPrice((item.priceAtAdd || item.priceAtPurchase) * item.quantity)}</p>
          </div>
        ))}
      </div>

      <div className="h-px bg-[#F0ECE3] my-4.5" />

      <div className="flex flex-col gap-2.5">
        <div className="flex justify-between text-sm text-[#3f3f38]">
          <span>Subtotal</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-[#40543C]">
          <span>Delivery</span>
          <span className="font-medium">{fee === 0 ? "Free" : formatPrice(fee)}</span>
        </div>
      </div>

      <div className="h-px bg-[#F0ECE3] my-4.5" />

      <div className="flex justify-between items-baseline">
        <span className="text-sm font-semibold text-[#292925]">Total</span>
        <span className="font-heading text-[26px] font-medium text-[#292925]">{formatPrice(total)}</span>
      </div>

      {children}
    </div>
  );
};

export default OrderSummary;
