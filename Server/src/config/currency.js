// PetCenter uses one transaction currency end-to-end. Keep Stripe's lowercase
// code derived from the same source so checkout and donation flows cannot drift.
export const CURRENCY_CODE = "USD";
export const STRIPE_CURRENCY = CURRENCY_CODE.toLowerCase();
