import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ShoppingCart, ArrowLeft, Package, Star, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { getProductById } from "../api/product.api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import ProductCard from "../components/store/ProductCard";
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
    if (!user) { window.location.href = "/login"; return; }
    if (!product || product.stock === 0 || adding) return;
    setAdding(true);
    const result = await addToCart(product._id, qty);
    setAdding(false);
    if (result.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-square bg-slate-100 rounded-[24px]" />
          <div className="space-y-4">
            <div className="h-8 bg-slate-100 rounded-xl w-3/4" />
            <div className="h-6 bg-slate-100 rounded-xl w-1/2" />
            <div className="h-12 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-24">
        <Package size={48} className="mx-auto mb-4 text-slate-300" />
        <h2 className="text-2xl font-black text-slate-900 mb-2">Product Not Found</h2>
        <Link to="/products" className="btn btn-primary">Back to Store</Link>
      </div>
    );
  }

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const maxQty = Math.min(product.stock, 10);

  return (
    <div>
      {/* Breadcrumb */}
      <Link to="/products" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors mb-8">
        <ArrowLeft size={16} /> Back to Store
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        {/* Images */}
        <div className="space-y-4">
          <Motion.div
            key={activeImg}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="aspect-square rounded-[28px] overflow-hidden bg-slate-50 border border-slate-100"
          >
            {product.images?.[activeImg]?.url ? (
              <img src={product.images[activeImg].url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package size={72} className="text-slate-300" />
              </div>
            )}
          </Motion.div>

          {/* Thumbnails */}
          {product.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    activeImg === i ? "border-primary shadow-lg" : "border-slate-100 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Category + Brand */}
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 bg-indigo-50 text-primary rounded-full text-[11px] font-black uppercase tracking-wider capitalize">{product.category}</span>
            {product.brand && (
              <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[11px] font-black uppercase tracking-wider">{product.brand}</span>
            )}
            {product.soldCount > 50 && (
              <span className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                <Star size={10} className="fill-rose-600" /> Bestseller
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter leading-tight">{product.name}</h1>

          {/* Price + Stock */}
          <div className="flex items-center gap-4">
            <span className="text-4xl font-black text-primary">{formatPrice(product.price)}</span>
            {isOutOfStock ? (
              <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-full text-[11px] font-black uppercase">Out of Stock</span>
            ) : isLowStock ? (
              <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-[11px] font-black uppercase flex items-center gap-1">
                <AlertTriangle size={11} /> Only {product.stock} left
              </span>
            ) : (
              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-black uppercase flex items-center gap-1">
                <CheckCircle size={11} /> In Stock ({product.stock})
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-slate-600 font-medium leading-relaxed">{product.description}</p>

          {/* Compatible Pets */}
          {product.compatiblePets?.length > 0 && (
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Compatible With</p>
              <div className="flex flex-wrap gap-2">
                {product.compatiblePets.map((pet) => (
                  <span key={pet} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 capitalize">
                    <span>{PET_ICONS[pet] || "🐾"}</span> {pet}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + Add to Cart */}
          {!isOutOfStock && (
            <div className="flex gap-3">
              <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-9 rounded-lg bg-white font-black text-slate-700 hover:text-primary flex items-center justify-center shadow-sm transition-all">-</button>
                <span className="w-8 text-center font-black text-slate-900">{qty}</span>
                <button onClick={() => setQty(Math.min(maxQty, qty + 1))} className="w-9 h-9 rounded-lg bg-white font-black text-slate-700 hover:text-primary flex items-center justify-center shadow-sm transition-all">+</button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={adding}
                className={`flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                  added ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                       : "bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-indigo-500/30 hover:scale-[1.01] active:scale-[0.99]"
                }`}
              >
                {adding ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> :
                 added ? <><CheckCircle size={18} /> Added to Cart!</> :
                 <><ShoppingCart size={18} /> Add to Cart</>}
              </button>
            </div>
          )}

          <Link to="/cart" className="block text-center text-sm font-bold text-primary hover:underline underline-offset-2 mt-2">
            View Cart →
          </Link>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-6">You Might Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
