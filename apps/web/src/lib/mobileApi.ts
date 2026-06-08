import type { WooCategory, WooCoupon, WooImage, WooProduct } from '@/lib/woocommerce';

function sanitizeImage(image?: WooImage) {
  if (!image) return undefined;

  return {
    id: image.id,
    src: image.src,
    name: image.name,
    alt: image.alt,
  };
}

export function sanitizeMobileCategory(category: WooCategory) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    image: sanitizeImage(category.image),
    count: category.count,
  };
}

export function sanitizeMobileProduct(product: WooProduct) {
  return {
    id: product.id,
    type: product.type,
    parent_id: product.parent_id,
    name: product.name,
    slug: product.slug,
    permalink: product.permalink,
    date_modified: product.date_modified,
    sku: product.sku,
    price: product.price,
    regular_price: product.regular_price,
    sale_price: product.sale_price,
    on_sale: product.on_sale,
    purchasable: product.purchasable,
    stock_status: product.stock_status,
    manage_stock: product.manage_stock,
    stock_quantity: product.stock_quantity,
    backorders: product.backorders,
    description: product.description,
    short_description: product.short_description,
    images: product.images.map(sanitizeImage).filter(Boolean),
    categories: product.categories.map(sanitizeMobileCategory),
    brands: product.brands || [],
    attributes: product.attributes,
    average_rating: product.average_rating,
    rating_count: product.rating_count,
    featured: product.featured,
    emart_version: product.emart_version,
  };
}

export function sanitizeMobileCoupon(coupon: WooCoupon) {
  return {
    id: coupon.id,
    code: coupon.code,
    amount: coupon.amount,
    discount_type: coupon.discount_type,
    date_expires: coupon.date_expires,
    minimum_amount: coupon.minimum_amount,
    maximum_amount: coupon.maximum_amount,
  };
}
