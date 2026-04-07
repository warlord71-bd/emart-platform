// src/lib/woo-helpers.ts
// Pure client-safe helper functions — no API credentials, no axios

export function formatPrice(price: string): string {
  const num = parseFloat(price);
  if (isNaN(num)) return '৳0';
  return `৳${num.toLocaleString('en-BD')}`;
}

export function getDiscountPercent(regular: string, sale: string): number {
  const reg = parseFloat(regular);
  const sal = parseFloat(sale);
  if (!reg || !sal) return 0;
  return Math.round(((reg - sal) / reg) * 100);
}

export function isInStock(product: { stock_status: string; purchasable: boolean }): boolean {
  return product.stock_status === 'instock' && product.purchasable;
}
