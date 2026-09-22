// Mirrors Server/src/controllers/order.controller.js's calculateShippingFee —
// keep both in sync if either threshold/fee changes. This client-side copy
// is only ever used as a pre-checkout estimate (e.g. on the Cart page,
// before a server round-trip); Checkout uses the authoritative fee returned
// by POST /orders/create-payment-intent once it's known.
export const FREE_SHIPPING_THRESHOLD_CENTS = 7500;
export const FLAT_SHIPPING_FEE_CENTS = 599;

export const estimateShippingFee = (subtotalCents) =>
  subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_FEE_CENTS;
