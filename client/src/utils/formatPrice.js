export const formatPrice = (price) => {
  const amount = Number(price);
  if (!amount || amount <= 0) return 'Price on request';
  return `₹${amount.toLocaleString('en-IN')}`;
};
