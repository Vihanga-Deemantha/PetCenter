export const CURRENCY_CODE = "USD";
export const CURRENCY_LOCALE = "en-US";

const currencyFormatter = new Intl.NumberFormat(CURRENCY_LOCALE, {
  style: "currency",
  currency: CURRENCY_CODE,
});

/** Format a value already expressed in the system's major currency unit. */
export const formatCurrency = (amount) => {
  const numericAmount = Number(amount);
  return currencyFormatter.format(Number.isFinite(numericAmount) ? numericAmount : 0);
};

/** Format a value stored in cents (e.g., 1999 → "$19.99"). */
export const formatPrice = (cents) => {
  const numericCents = Number(cents);
  return formatCurrency(Number.isFinite(numericCents) ? numericCents / 100 : 0);
};

/**
 * Format cents to a plain number string (e.g., 1999 → "19.99")
 */
export const centsToDecimal = (cents) => {
  if (cents == null || isNaN(cents)) return "0.00";
  return (cents / 100).toFixed(2);
};

/**
 * Convert a major-unit decimal string to cents (e.g., "19.99" → 1999).
 */
export const dollarsToCents = (dollars) => {
  return Math.round(parseFloat(dollars) * 100);
};
