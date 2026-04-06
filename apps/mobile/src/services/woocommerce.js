import { API_CONFIG, getAuthParams } from '../config/api';

const BASE = API_CONFIG.baseUrl;
const AUTH = getAuthParams();


// ================================
// API REQUEST WRAPPER
// ================================

const apiFetch = async (endpoint, params = '') => {

  const url = `${BASE}${endpoint}?${AUTH}${params ? '&' + params : ''}`;

  try {

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`WooCommerce API Error: ${response.status}`);
    }

    const data = await response.json();

    return { data, error: null };

  } catch (error) {

    return { data: null, error: error.message };

  }
};

const apiPost = async (endpoint, body) => {

  const url = `${BASE}${endpoint}?${AUTH}`;

  try {

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `API Error: ${response.status}`);
    }

    const data = await response.json();

    return { data, error: null };

  } catch (error) {

    return { data: null, error: error.message };

  }
};



// ================================
// PRODUCTS
// ================================

export const getProducts = async (
  page = 1,
  perPage = API_CONFIG.perPage,
  params = ''
) => {

  return apiFetch(
    '/products',
    `page=${page}&per_page=${perPage}&status=publish&orderby=date&order=desc${params ? '&' + params : ''}`
  );

};


export const getProduct = async (id) => {

  return apiFetch(`/products/${id}`);

};


export const searchProducts = async (query, page = 1) => {

  return apiFetch(
    '/products',
    `search=${encodeURIComponent(query)}&page=${page}&per_page=${API_CONFIG.perPage}&status=publish`
  );

};


export const getProductsByCategory = async (categoryId, page = 1) => {

  return apiFetch(
    '/products',
    `category=${categoryId}&page=${page}&per_page=${API_CONFIG.perPage}&status=publish`
  );

};


export const getFeaturedProducts = async () => {

  return apiFetch(
    '/products',
    `featured=true&per_page=10&status=publish`
  );

};


export const getOnSaleProducts = async () => {

  return apiFetch(
    '/products',
    `on_sale=true&per_page=10&status=publish`
  );

};


export const getTopRatedProducts = async () => {

  return apiFetch(
    '/products',
    `orderby=rating&order=desc&per_page=10&status=publish`
  );

};


export const getLatestProducts = async () => {

  return apiFetch(
    '/products',
    `orderby=date&order=desc&per_page=10&status=publish`
  );

};



// ================================
// CATEGORIES
// ================================

export const getCategories = async (params = '') => {

  return apiFetch(
    '/products/categories',
    `per_page=100&orderby=count&order=desc&hide_empty=true${params ? '&' + params : ''}`
  );

};


export const getParentCategories = async () => {

  return apiFetch(
    '/products/categories',
    `parent=0&per_page=50&orderby=count&order=desc&hide_empty=true`
  );

};


export const getSubCategories = async (parentId) => {

  return apiFetch(
    '/products/categories',
    `parent=${parentId}&per_page=50&hide_empty=true`
  );

};



// ================================
// REVIEWS
// ================================

export const getProductReviews = async (productId) => {

  return apiFetch(
    '/products/reviews',
    `product=${productId}&per_page=20&orderby=date_created&order=desc`
  );

};


export const submitProductReview = async (productId, reviewData) => {

  return apiPost('/products/reviews', {
    product_id: productId,
    review: reviewData.review,
    reviewer: reviewData.name,
    reviewer_email: reviewData.email,
    rating: reviewData.rating,
  });

};



// ================================
// COUPONS
// ================================

export const validateCoupon = async (code) => {

  return apiFetch(
    '/coupons',
    `code=${encodeURIComponent(code)}`
  );

};



// ================================
// ORDERS
// ================================

export const createOrder = async (orderData) => {

  return apiPost('/orders', orderData);

};



// ================================
// HTML HELPERS
// ================================

export const decodeHTML = (str = '') => {

  if (!str || typeof str !== 'string') return '';

  const map = {
    '&#8217;': '\u2019',
    '&#8216;': '\u2018',
    '&#8220;': '\u201C',
    '&#8221;': '\u201D',
    '&#038;': '&',
    '&#8211;': '\u2013',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' '
  };

  let result = str;

  Object.keys(map).forEach(k => {
    result = result.split(k).join(map[k]);
  });

  result = result.replace(/&#(\d+);/g, (_, c) =>
    String.fromCharCode(parseInt(c))
  );

  return result.trim();
};


export const stripHTML = (html = '') => {

  if (!html || typeof html !== 'string') return '';

  return decodeHTML(
    html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
  );

};



// ================================
// PRODUCT HELPERS
// ================================

export const getProductPrice = (product = {}) => {

  const regular = parseFloat(product.regular_price) || 0;
  const sale = parseFloat(product.sale_price) || 0;
  const price = parseFloat(product.price) || 0;

  return {
    current: sale > 0 ? sale : price,
    regular,
    onSale: sale > 0 && sale < regular,
    discount: regular > 0 && sale > 0
      ? Math.round((1 - sale / regular) * 100)
      : 0
  };

};


export const getProductImage = (product = {}) => {

  if (
    product.images &&
    product.images.length > 0 &&
    product.images[0]?.src
  ) {
    return product.images[0].src.replace(/^http:/, 'https:');
  }

  return API_CONFIG.placeholderImage;

};


export const getProductImages = (product = {}) => {

  if (product.images && product.images.length > 0) {

    return product.images
      .filter(img => img && img.src)
      .map(img => img.src.replace(/^http:/, 'https:'));

  }

  return [API_CONFIG.placeholderImage];

};


export const getCategoryImage = (category = {}) => {

  if (category?.image?.src) {
    return category.image.src.replace(/^http:/, 'https:');
  }

  return null;

};
