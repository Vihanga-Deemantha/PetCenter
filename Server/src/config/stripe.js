import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  maxNetworkRetries: 3, // Retry failed requests up to 3 times
});

export default stripe;
