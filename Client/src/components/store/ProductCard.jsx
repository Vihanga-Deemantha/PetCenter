import React from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ShoppingCart, Star, Package } from "lucide-react";
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
  const [addError, setAddError] = React.useState("");

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    if (isOutOfStock || adding) return;
    setAdding(true);
    setAddError("");
    const result = await addToCart(product._id, 1);
    setAdding(false);
    if (result.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } else {
      setAddError(result.error || "Couldn't add to cart");
      setTimeout(() => setAddError(""), 4000);
    }
  };

  return (
    <Motion.article
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-white border border-[#E8E2D8] rounded-card p-4 flex flex-col gap-3"
    >
      <Link to={`/products/${product._id}`} className="block">
        <div className="relative rounded-2xl overflow-hidden aspect-square bg-light mb-3.5">
          {product.images?.[0]?.url ? (
            <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package size={40} className="text-[#c9c2b3]" />
            </div>
          )}

          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            {isOutOfStock && <span className="px-2.5 py-1 bg-[#292925]/90 text-white rounded-full text-[10px] font-semibold uppercase tracking-wider">Out of stock</span>}
            {isLowStock && !isOutOfStock && <span className="px-2.5 py-1 bg-primary/90 text-white rounded-full text-[10px] font-semibold uppercase tracking-wider">Only {product.stock} left</span>}
            {product.soldCount > 50 && (
              <span className="px-2.5 py-1 bg-secondary/90 text-white rounded-full text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 w-fit">
                <Star size={9} className="fill-white" /> Bestseller
              </span>
            )}
          </div>

          <div className="absolute bottom-2.5 right-2.5 z-10">
            <HeartButton itemType="product" itemId={product._id} size={15} />
          </div>
        </div>

        <div className="flex gap-1 mb-1.5 flex-wrap">
          {product.compatiblePets?.slice(0, 4).map((pet) => (
            <span key={pet} className="text-xs" title={pet}>
              {petIcons[pet] || "🐾"}
            </span>
          ))}
        </div>

        <p className="m-0 text-[11px] tracking-[0.12em] uppercase text-[#8a8a80]">{product.category}</p>
        <h3 className="mt-1.5 mb-0 font-semibold text-[15px] text-[#292925] leading-snug line-clamp-2">{product.name}</h3>

        {product.reviewCount > 0 ? (
          <p className="mt-1.5 mb-0 text-[12px] text-[#6e6e64]">★ {product.averageRating} · {product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"}</p>
        ) : (
          <p className="mt-1.5 mb-0 text-[11px] text-[#a8a49a]">No reviews yet</p>
        )}

        <div className="flex items-center justify-between mt-2.5">
          <span className="text-[17px] text-[#292925]">{formatPrice(product.price)}</span>
          {!isOutOfStock && <span className="text-[11px] text-[#40543C] font-medium">{product.stock} in stock</span>}
        </div>
      </Link>

      <button
        onClick={handleAddToCart}
        disabled={isOutOfStock || adding}
        className={`w-full py-2.75 rounded-full text-[13px] font-medium transition-colors flex items-center justify-center gap-2 ${
          isOutOfStock
            ? "bg-border text-[#a8a49a] cursor-not-allowed"
            : added
              ? "bg-accent text-white"
              : "border border-[#cfc8ba] text-secondary hover:bg-accent hover:text-white hover:border-accent"
        }`}
      >
        {adding ? (
          <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : added ? (
          "Added to cart"
        ) : isOutOfStock ? (
          "Out of stock"
        ) : (
          <>
            <ShoppingCart size={14} /> Add to cart
          </>
        )}
      </button>
      {addError && <p className="mt-0 text-[11px] font-medium text-[#8f4a28] text-center">{addError}</p>}
    </Motion.article>
  );
};

export default ProductCard;
