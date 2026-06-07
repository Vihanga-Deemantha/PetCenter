import axiosInstance from "./axiosInstance";

/**
 * Create a Stripe PaymentIntent.
 * @param {object} shippingAddress - { fullName, addressLine1, addressLine2, city, country, postalCode }
 * @returns { clientSecret, paymentIntentId, totalAmount, orderItems }
 */
export const createPaymentIntent = (shippingAddress) =>
  axiosInstance.post("/orders/create-payment-intent", { shippingAddress });
