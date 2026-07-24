// Currency helper for Pakistan localization
export const CURRENCY_SYMBOL = 'Rs.';
export const CURRENCY_CODE = 'PKR';

export const formatPrice = (amount: number): string => {
  return `${CURRENCY_SYMBOL} ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};
