export const isProductAvailableForCart = (product = {}) => {
  if (!product || product.purchasable === false) return false;
  if (product.stock_status === 'outofstock') return false;
  return product.stock_status === 'instock' || product.stock_status === 'onbackorder' || !product.stock_status;
};

export const getMaxCartQuantity = (product = {}) => {
  if (!isProductAvailableForCart(product)) return 0;
  if (product.stock_status === 'onbackorder') return 99;

  const stockQuantity = Number(product.stock_quantity);
  if (Number.isFinite(stockQuantity) && stockQuantity > 0) {
    return Math.max(1, Math.floor(stockQuantity));
  }

  return 99;
};

export const getCartProductIds = (product = {}) => {
  const productId = product.type === 'variation' && product.parent_id ? product.parent_id : product.id;
  const variationId = product.type === 'variation' ? product.id : product.variation_id;

  return {
    product_id: product.product_id || productId,
    variation_id: variationId || undefined,
  };
};
