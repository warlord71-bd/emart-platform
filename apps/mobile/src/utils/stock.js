export const isProductAvailableForCart = (product = {}) => {
  if (!product || product.purchasable === false) return false;
  if (product.stock_status === 'outofstock') return false;
  return product.stock_status === 'instock' || product.stock_status === 'onbackorder' || !product.stock_status;
};

export const getCartProductIds = (product = {}) => {
  const productId = product.type === 'variation' && product.parent_id ? product.parent_id : product.id;
  const variationId = product.type === 'variation' ? product.id : product.variation_id;

  return {
    product_id: product.product_id || productId,
    variation_id: variationId || undefined,
  };
};
