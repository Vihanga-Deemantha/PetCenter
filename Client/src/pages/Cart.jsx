import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, ArrowRight, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import CartItem from "../components/store/CartItem";
import OrderSummary from "../components/store/OrderSummary";

const Cart = () => {
  const { user } = useAuth();
  const { cartItems, itemCount, cartTotal, loading, clearCart } = useCart();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="text-center py-24">
        <ShoppingCart size={52} className="mx-auto mb-4 text-slate-300" />
        <h2 className="text-2xl font-black text-slate-900 mb-2">Sign in to view your cart</h2>
        <p className="text-slate-500 font-medium mb-6">Your cart is waiting for you.</p>
        <Link to="/login" className="btn btn-primary">Sign In</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-pulse">
        <div className="lg:col-span-2 space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-slate-100 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-24">
        <Motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="inline-flex items-center justify-center w-24 h-24 bg-linear-to-br from-primary to-accent rounded-[28px] shadow-2xl shadow-primary/30 mb-8"
        >
          <ShoppingBag size={40} className="text-white" />
        </Motion.div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-3">Your cart is empty</h2>
        <p className="text-slate-500 font-medium text-lg mb-8">Add some amazing pet products!</p>
        <Link to="/products" className="btn btn-primary px-8 py-4 text-base">
          Browse Products <ArrowRight size={18} />
        </Link>
      </Motion.div>
    );
  }

  return (
    <div>
      {/* Header */}
      <Motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900">
          Your <span className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">Cart</span>
        </h1>
        <p className="text-slate-500 font-medium mt-1">{itemCount} item{itemCount !== 1 ? "s" : ""} in your cart</p>
      </Motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {cartItems.map((item) => (
              <CartItem key={item.productId} item={item} />
            ))}
          </AnimatePresence>

          {/* Clear Cart */}
          <div className="flex justify-end pt-2">
            <button
              onClick={clearCart}
              className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-rose-500 transition-colors"
            >
              <Trash2 size={14} /> Clear Cart
            </button>
          </div>
        </div>

        {/* Summary */}
        <div>
          <OrderSummary items={cartItems} total={cartTotal}>
            <button
              onClick={() => navigate("/checkout")}
              className="w-full mt-4 py-4 rounded-xl font-black text-white bg-linear-to-br from-primary to-accent shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Proceed to Checkout <ArrowRight size={18} />
            </button>
            <Link to="/products" className="block text-center mt-3 text-sm font-bold text-slate-500 hover:text-primary transition-colors">
              ← Continue Shopping
            </Link>
          </OrderSummary>
        </div>
      </div>
    </div>
  );
};

export default Cart;
