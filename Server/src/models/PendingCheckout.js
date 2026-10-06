import mongoose from "mongoose";

// A snapshot of exactly what a Stripe PaymentIntent was created to charge
// for — cart contents, prices, and totals — captured at createPaymentIntent
// time. verifyPayment (driven by the webhook, which can fire minutes after
// the intent was created) builds the Order from THIS snapshot, never from
// the user's live cart, so items added/changed in the cart after payment was
// initiated can never get silently folded into an order that was paid for
// something else entirely. TTL-expires unclaimed snapshots from abandoned or
// failed checkouts.
const pendingCheckoutSchema = new mongoose.Schema({
  paymentIntentId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      name: { type: String, required: true },
      image: { url: String, publicId: String },
      priceAtPurchase: { type: Number, required: true },
      quantity: { type: Number, required: true, min: 1 },
    },
  ],
  subtotal: { type: Number, required: true },
  shippingFee: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  // Keep fulfillment data in the same server-owned snapshot as the items and
  // totals.  The client confirmation endpoint can then finalize an order
  // without trusting address data posted after payment or depending on
  // Stripe webhook metadata being delivered first.
  shippingAddress: {
    fullName: { type: String },
    addressLine1: { type: String },
    addressLine2: { type: String, default: "" },
    city: { type: String },
    country: { type: String },
    postalCode: { type: String },
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24, // 24h safety-net TTL for abandoned/failed checkouts
  },
});

const PendingCheckout = mongoose.model("PendingCheckout", pendingCheckoutSchema);
export default PendingCheckout;
