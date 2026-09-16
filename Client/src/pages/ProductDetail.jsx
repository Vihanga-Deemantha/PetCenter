import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ShoppingCart, ArrowLeft, Package, Star, CheckCircle, AlertTriangle } from "lucide-react";
import { getProductById } from "../api/product.api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import ProductCard from "../components/store/ProductCard";
import HeartButton from "../components/ui/HeartButton";
import ProductReviews from "../components/store/ProductReviews";
import { formatPrice } from "../utils/priceFormatter";

const PET_ICONS = { dog: "🐕", cat: "🐈", bird: "🦜", fish: "🐟", snake: "🐍", rabbit: "🐇", turtle: "🐢", mouse: "🐭", universal: "🐾" };

const ProductDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState(null);
  const [addError, setAddError] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    setError(null);
    getProductById(id)
      .then((res) => {
        const { relatedProducts: related, ...prod } = res.data.data;
        setProduct(prod);
        setRelatedProducts(related || []);
        setActiveImg(0);
        setQty(1);
      })
      .catch(() => setError("Product not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    if (!product || product.stock === 0 || adding) return;
    setAdding(true);
    setAddError("");
    const result = await addToCart(product._id, qty);
    setAdding(false);
    if (result.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } else {
      setAddError(result.error || "Couldn't add to cart");
      setTimeout(() => setAddError(""), 4000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-7 py-10 animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-square bg-border rounded-card" />
          <div className="space-y-4">
            <div className="h-8 bg-border rounded-xl w-3/4" />
            <div className="h-6 bg-border rounded-xl w-1/2" />
            <div className="h-12 bg-border rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-7 text-center py-24">
        <Package size={40} className="mx-auto mb-4 text-[#c9c2b3]" />
        <h2 className="font-heading text-2xl text-[#292925] mb-2">Product not found</h2>
        <Link to="/products" className="btn btn-primary">
          Back to store
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const maxQty = Math.min(product.stock, 10);

  return (
    <div className="max-w-7xl mx-auto px-7 pb-20">
      <Link to="/products" className="inline-flex items-center gap-2 text-sm font-medium text-[#6e6e64] hover:text-primary transition-colors mb-7 mt-6">
        <ArrowLeft size={16} /> Back to store
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-11 mb-16">
        <div className="space-y-3.5">
          <Motion.div key={activeImg} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="aspect-square rounded-[26px] overflow-hidden bg-light border border-[#dcd4c6]">
            {product.images?.[activeImg]?.url ? (
              <img src={product.images[activeImg].url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package size={60} className="text-[#c9c2b3]" />
              </div>
            )}
          </Motion.div>

          {product.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`w-16 h-16 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${activeImg === i ? "border-primary" : "border-[#dcd4c6] opacity-60 hover:opacity-100"}`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <span className="px-3.5 py-1.75 bg-accent/10 text-secondary rounded-full text-[11px] font-semibold uppercase tracking-wider">{product.category}</span>
            {product.brand && <span className="px-3.5 py-1.75 bg-border text-[#4F5B4B] rounded-full text-[11px] font-semibold uppercase tracking-wider">{product.brand}</span>}
            {product.soldCount > 50 && (
              <span className="px-3.5 py-1.75 bg-[#F7E9DF] text-[#8f4a28] rounded-full text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1">
                <Star size={10} className="fill-current" /> Bestseller
              </span>
            )}
          </div>

          <h1 className="font-heading text-[32px] sm:text-[40px] font-medium tracking-tight leading-[1.1] m-0">{product.name}</h1>

          {product.reviewCount > 0 ? (
            <div className="flex items-center gap-2 text-sm font-medium text-[#3f3f38]">
              <div className="flex text-primary">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className={i < Math.round(product.averageRating) ? "fill-primary" : "text-border"} />
                ))}
              </div>
              <span>{product.averageRating} ★</span>
              <span className="text-[#8a8a80]">
                ({product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"})
              </span>
            </div>
          ) : (
            <p className="text-xs text-[#a8a49a] font-medium">No reviews yet</p>
          )}

          <div className="flex items-center gap-3.5 flex-wrap">
            <span className="font-heading text-[34px] font-medium text-[#292925]">{formatPrice(product.price)}</span>
            {isOutOfStock ? (
              <span className="px-3 py-1.75 bg-border text-[#6e6e64] rounded-full text-[11px] font-semibold uppercase">Out of stock</span>
            ) : isLowStock ? (
              <span className="px-3 py-1.75 bg-[#F7E9DF] text-[#8f4a28] rounded-full text-[11px] font-semibold uppercase flex items-center gap-1">
                <AlertTriangle size={11} /> Only {product.stock} left
              </span>
            ) : (
              <span className="px-3 py-1.75 bg-[#E9EDE4] text-[#40543C] rounded-full text-[11px] font-semibold uppercase flex items-center gap-1">
                <CheckCircle size={11} /> In stock ({product.stock})
              </span>
            )}
            <HeartButton itemType="product" itemId={product._id} size={20} />
          </div>

          <p className="text-[#5c5c54] leading-relaxed">{product.description}</p>

          {product.compatiblePets?.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8a8a80] mb-2">Compatible with</p>
              <div className="flex flex-wrap gap-2">
                {product.compatiblePets.map((pet) => (
                  <span key={pet} className="flex items-center gap-1.5 px-3.5 py-1.75 bg-light border border-border rounded-xl text-sm font-medium text-[#3f3f38] capitalize">
                    <span>{PET_ICONS[pet] || "🐾"}</span> {pet}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!isOutOfStock && (
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5 border border-[#E0D9CC] rounded-full p-1 bg-white">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-9 rounded-full text-secondary hover:bg-light flex items-center justify-center text-lg leading-none transition-colors">
                  −
                </button>
                <span className="w-8 text-center font-semibold text-[#292925]">{qty}</span>
                <button onClick={() => setQty(Math.min(maxQty, qty + 1))} className="w-9 h-9 rounded-full text-secondary hover:bg-light flex items-center justify-center text-lg leading-none transition-colors">
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={adding}
                className={`flex-1 py-3 rounded-full font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                  added ? "bg-accent text-white" : "bg-primary text-white hover:bg-primary-dark"
                }`}
              >
                {adding ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                ) : added ? (
                  <>
                    <CheckCircle size={17} /> Added to cart
                  </>
                ) : (
                  <>
                    <ShoppingCart size={17} /> Add to cart
                  </>
                )}
              </button>
            </div>
          )}
          {addError && <p className="text-sm font-medium text-[#8f4a28] text-center mt-1">{addError}</p>}

          <Link to="/cart" className="block text-center text-sm font-medium text-secondary hover:underline underline-offset-2 mt-2">
            View cart →
          </Link>
        </div>
      </div>

      <ProductReviews productId={product._id} />

      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="font-heading text-[26px] font-medium tracking-tight mb-6">You might also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
