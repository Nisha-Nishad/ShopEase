/**
 * Formats a number as Indian Rupees (e.g. 24990 -> ₹24,990)
 */
export const formatPrice = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

/**
 * Calculates discount percentage between original price and discountPrice
 */
export const getDiscountPercent = (price, discountPrice) => {
  if (!discountPrice || discountPrice <= 0 || discountPrice >= price) return 0;
  return Math.round(((price - discountPrice) / price) * 100);
};
