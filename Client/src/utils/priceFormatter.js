/**
 * Format cents to a dollar string (e.g., 1999 → "$19.99")
 */
export const formatPrice = (cents) => {
  if (cents == null || isNaN(cents)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
};

/**
 * Format cents to a plain number string (e.g., 1999 → "19.99")
 */
export const centsToDecimal = (cents) => {
  if (cents == null || isNaN(cents)) return "0.00";
  return (cents / 100).toFixed(2);
};

/**
 * Convert a dollar decimal string to cents integer (e.g., "19.99" → 1999)
 */
export const dollarsToCents = (dollars) => {
  return Math.round(parseFloat(dollars) * 100);
};
