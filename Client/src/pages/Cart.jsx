import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, ArrowRight, Trash2, ShoppingBag, AlertTriangle } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import CartItem from "../components/store/CartItem";
import OrderSummary from "../components/store/OrderSummary";
import CheckoutSteps from "../components/store/CheckoutSteps";

const Cart = () => {
  const { user } = useAuth();
  const { cartItems, itemCount, cartTotal, loading, error, fetchCart, clearCart } = useCart();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-7 text-center py-24">
        <ShoppingCart size={44} className="mx-auto mb-4 text-[#c9c2b3]" />
        <h2 className="font-heading text-2xl text-[#292925] mb-2">Sign in to view your cart</h2>
        <p className="text-[#6e6e64] mb-6">Your cart is waiting for you.</p>
        <Link to="/login" className="btn btn-primary">
          Sign in
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-7 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.62fr_1fr] gap-9 animate-pulse">
          <div className="space-y-3.5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 bg-border rounded-[20px]" />
            ))}
          </div>
          <div className="h-64 bg-border rounded-[22px]" />
        </div>
      </div>
    );
  }

  if (error && cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-7 text-center py-24">
        <AlertTriangle size={44} className="mx-auto mb-4 text-[#d79274]" />
        <h2 className="font-heading text-2xl text-[#292925] mb-2">{error}</h2>
        <button onClick={fetchCart} className="btn btn-primary mt-2">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-7 pt-7 pb-24">
      <CheckoutSteps current="cart" itemLabel={`${itemCount} item${itemCount !== 1 ? "s" : ""}`} />

      <h1 className="font-heading text-[36px] sm:text-[44px] font-medium tracking-tight mb-2">Your cart</h1>
      <p className="text-[15px] text-[#5c5c54] mb-8">Delivery is free on every order — no separate shipping step to worry about.</p>

      {cartItems.length === 0 ? (
        <Motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-[#E8E2D8] rounded-[22px] py-16 px-8 text-center">
          <div className="inline-flex items-center justify-center w-18 h-18 bg-accent/10 rounded-[22px] mb-6">
            <ShoppingBag size={32} className="text-accent" />
          </div>
          <h2 className="font-heading text-[26px] font-medium mb-2.5">Your cart is empty</h2>
          <p className="text-[#6e6e64] mb-7">Beds, bowls and habitat kits are waiting in the store.</p>
          <Link to="/products" className="btn btn-primary px-7 py-3.5">
            Browse the store <ArrowRight size={17} />
          </Link>
        </Motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1.62fr_1fr] gap-9 items-start">
          <div className="min-w-0 flex flex-col gap-3.5">
            <AnimatePresence>
              {cartItems.map((item) => (
                <CartItem key={item.productId} item={item} />
              ))}
            </AnimatePresence>

            <div className="flex justify-between items-center gap-4 pt-1">
              <Link to="/products" className="text-[13.5px] font-medium text-secondary">
                Continue shopping
              </Link>
              <button onClick={clearCart} className="flex items-center gap-1.5 text-[13px] text-[#8a8a80] hover:text-primary transition-colors">
                <Trash2 size={13} /> Clear cart
              </button>
            </div>
          </div>

          <div className="lg:sticky lg:top-28">
            <OrderSummary items={cartItems} total={cartTotal}>
              <button onClick={() => navigate("/checkout")} className="btn btn-primary w-full py-3.75 mt-5">
                Checkout <ArrowRight size={17} />
              </button>
            </OrderSummary>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
