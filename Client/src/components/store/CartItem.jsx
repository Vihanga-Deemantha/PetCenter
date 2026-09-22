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
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      className={`bg-white border border-[#E8E2D8] rounded-[20px] p-4.5 grid grid-cols-[88px_1fr_auto] gap-4.5 items-center transition-opacity ${updating ? "opacity-50" : ""}`}
    >
      <Link to={`/products/${item.productId}`} className="shrink-0">
        <div className="w-22 h-22 rounded-2xl overflow-hidden bg-light border border-border">
          {item.product?.image?.url ? (
            <img src={item.product.image.url} alt={item.product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package size={24} className="text-[#c9c2b3]" />
            </div>
          )}
        </div>
      </Link>

      <div className="min-w-0">
        <Link to={`/products/${item.productId}`}>
          <p className="font-heading text-lg font-medium text-[#292925] leading-tight hover:text-primary transition-colors line-clamp-2 m-0">{item.product?.name || "Product"}</p>
        </Link>
        <p className="text-sm font-semibold text-primary mt-1.25">{formatPrice(item.priceAtAdd)}</p>
        {item.product?.stock > 0 && item.product.stock <= 5 && <p className="text-[11px] text-[#8f4a28] font-medium mt-1">Only {item.product.stock} left!</p>}

        <div className="flex items-center gap-1 mt-3.5 border border-[#E0D9CC] rounded-full p-0.75 w-fit">
          <button onClick={() => handleQtyChange(item.quantity - 1)} disabled={updating} className="w-7.5 h-7.5 rounded-full text-secondary hover:bg-light flex items-center justify-center transition-colors disabled:opacity-40">
            {item.quantity === 1 ? <Trash2 size={13} /> : <Minus size={13} />}
          </button>
          <span className="w-7 text-center font-semibold text-[#292925] text-sm">
            {updating ? <div className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" /> : item.quantity}
          </span>
          <button
            onClick={() => handleQtyChange(item.quantity + 1)}
            disabled={updating || item.quantity >= (item.product?.stock ?? 99)}
            className="w-7.5 h-7.5 rounded-full text-secondary hover:bg-light flex items-center justify-center transition-colors disabled:opacity-40"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      <p className="font-semibold text-[#292925] text-[17px] whitespace-nowrap">{formatPrice(subtotal)}</p>
    </Motion.div>
  );
};

export default CartItem;
