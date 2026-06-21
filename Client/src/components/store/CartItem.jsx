import React from "react";
import { Link } from "react-router-dom";
import { Trash2, Plus, Minus, Package } from "lucide-react";
import { motion as Motion } from "framer-motion";
import { formatPrice } from "../../utils/priceFormatter";
import { useCart } from "../../context/CartContext";

const CartItem = ({ item }) => {
  const { updateQuantity } = useCart();
  const [updating, setUpdating] = React.useState(false);

  const handleQtyChange = async (newQty) => {
    if (updating) return;
    setUpdating(true);
    await updateQuantity(item.productId, newQty);
    setUpdating(false);
  };



  const subtotal = item.priceAtAdd * item.quantity;

  return (
    <Motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`flex gap-4 p-4 rounded-2xl border border-slate-100 bg-white transition-opacity ${updating ? "opacity-50" : ""}`}
    >
      {/* Product Image */}
      <Link to={`/products/${item.productId}`} className="shrink-0">
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
          {item.product?.image?.url ? (
            <img src={item.product.image.url} alt={item.product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package size={28} className="text-slate-300" />
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link to={`/products/${item.productId}`}>
          <h4 className="font-black text-slate-900 text-sm leading-tight hover:text-primary transition-colors line-clamp-2">
            {item.product?.name || "Product"}
          </h4>
        </Link>
        <p className="text-sm font-bold text-primary mt-1">{formatPrice(item.priceAtAdd)}</p>

        {/* Low stock warning */}
        {item.product?.stock > 0 && item.product.stock <= 5 && (
          <p className="text-[11px] text-amber-600 font-bold mt-1">Only {item.product.stock} left!</p>
        )}
      </div>

      {/* Qty + Remove */}
      <div className="flex flex-col items-end justify-between shrink-0">
        {/* Subtotal */}
        <p className="font-black text-slate-900 text-base">{formatPrice(subtotal)}</p>

        {/* Stepper */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => handleQtyChange(item.quantity - 1)}
            disabled={updating}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all disabled:opacity-40"
          >
            {item.quantity === 1 ? <Trash2 size={13} /> : <Minus size={13} />}
          </button>
          <span className="w-8 text-center font-black text-slate-900 text-sm">
            {updating ? <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" /> : item.quantity}
          </span>
          <button
            onClick={() => handleQtyChange(item.quantity + 1)}
            disabled={updating || item.quantity >= (item.product?.stock || 99)}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-all disabled:opacity-40"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>
    </Motion.div>
  );
};

export default CartItem;
