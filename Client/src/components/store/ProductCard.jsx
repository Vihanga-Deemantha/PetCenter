import React from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ShoppingCart, Star, Package, AlertTriangle } from "lucide-react";
import { formatPrice } from "../../utils/priceFormatter";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import HeartButton from "../ui/HeartButton";

const petIcons = { dog: "🐕", cat: "🐈", bird: "🦜", fish: "🐟", snake: "🐍", rabbit: "🐇", turtle: "🐢", mouse: "🐭", universal: "🐾" };

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [adding, setAdding] = React.useState(false);
  const [added, setAdded] = React.useState(false);

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!user) { window.location.href = "/login"; return; }
    if (isOutOfStock || adding) return;
    setAdding(true);
    const result = await addToCart(product._id, 1);
    setAdding(false);
    if (result.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  return (
    <Motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group glass-card bg-white border-slate-100 shadow-sm overflow-hidden flex flex-col"
    >
      <Link to={`/products/${product._id}`} className="block">
        {/* Image */}
        <div className="relative overflow-hidden aspect-square bg-slate-50">
          {product.images?.[0]?.url ? (
            <img
              src={product.images[0].url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">
              <Package size={48} className="text-slate-300" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {isOutOfStock && (
              <span className="px-2.5 py-1 bg-slate-800/90 text-white rounded-lg text-[10px] font-black uppercase tracking-wider backdrop-blur-sm">
                Out of Stock
              </span>
            )}
            {isLowStock && !isOutOfStock && (
              <span className="px-2.5 py-1 bg-amber-500/90 text-white rounded-lg text-[10px] font-black uppercase tracking-wider backdrop-blur-sm">
                Only {product.stock} left
              </span>
            )}
            {product.soldCount > 50 && (
              <span className="px-2.5 py-1 bg-rose-500/90 text-white rounded-lg text-[10px] font-black uppercase tracking-wider backdrop-blur-sm flex items-center gap-1">
                <Star size={9} className="fill-white" /> Bestseller
              </span>
            )}
          </div>

          {/* Category chip */}
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 bg-white/90 text-primary rounded-lg text-[10px] font-black uppercase tracking-wider backdrop-blur-sm border border-white/50">
              {product.category}
            </span>
          </div>

          {/* Heart Button */}
          <div className="absolute bottom-3 right-3 z-10">
            <HeartButton itemType="product" itemId={product._id} size={16} />
          </div>
        </div>

        {/* Info */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Pet compatibility */}
          <div className="flex gap-1 mb-2 flex-wrap">
            {product.compatiblePets?.slice(0, 4).map((pet) => (
              <span key={pet} className="text-xs" title={pet}>{petIcons[pet] || "🐾"}</span>
            ))}
          </div>

          <h3 className="font-black text-slate-900 text-sm leading-tight mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          {product.brand && (
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{product.brand}</p>
          )}

          {product.reviewCount > 0 ? (
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 mb-2">
              <Star size={11} className="fill-amber-500 text-amber-500" />
              <span>{product.averageRating} ({product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"})</span>
            </div>
          ) : (
            <div className="text-[10px] text-slate-300 font-bold mb-2">No reviews yet</div>
          )}

          <div className="mt-auto pt-3 flex items-center justify-between">
            <span className="text-xl font-black text-slate-900">{formatPrice(product.price)}</span>
            {!isOutOfStock && (
              <span className="text-[11px] text-emerald-600 font-bold">{product.stock} in stock</span>
            )}
          </div>
        </div>
      </Link>

      {/* Add to Cart Button */}
      <div className="px-5 pb-5">
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || adding}
          className={`w-full py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
            isOutOfStock
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : added
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
              : "bg-linear-to-br from-primary to-accent text-white shadow-lg shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98]"
          }`}
        >
          {adding ? (
            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : added ? (
            <><span>✓</span> Added!</>
          ) : isOutOfStock ? (
            "Out of Stock"
          ) : (
            <><ShoppingCart size={15} /> Add to Cart</>
          )}
        </button>
      </div>
    </Motion.div>
  );
};

export default ProductCard;
