import { API_CONFIG } from '../config/api';

const BASE = API_CONFIG.baseUrl;


// ================================
// API REQUEST WRAPPER
// ================================

const toQueryObject = (params = '') => {
  if (!params) return {};
  if (typeof params === 'object') return params;

  const query = {};
  const searchParams = new URLSearchParams(params);
  searchParams.forEach((value, key) => {
    query[key] = value;
  });
  return query;
};

const buildUrl = (endpoint, params = '') => {
  const searchParams = new URLSearchParams();
  const query = toQueryObject(params);

  Object.keys(query).forEach((key) => {
    const value = query[key];
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return `${BASE}${endpoint}${queryString ? `?${queryString}` : ''}`;
};

const apiFetch = async (endpoint, params = '') => {
  const url = buildUrl(endpoint, params);

  try {

    const response = await fetch(url);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || `API Error: ${response.status}`);
    }

    const data = await response.json();

    return { data, error: null };

  } catch (error) {

    return { data: null, error: error.message };

  }
};

const apiPost = async (endpoint, body) => {

  const url = `${BASE}${endpoint}`;

  try {

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || `API Error: ${response.status}`);
    }

    const data = await response.json();

    return { data, error: null };

  } catch (error) {

    return { data: null, error: error.message };

  }
};

const productListFetch = async (params = {}) => {
  const res = await apiFetch('/api/mobile/products', params);
  if (res.error) return res;

  return {
    data: res.data?.products || [],
    total: res.data?.total || 0,
    totalPages: res.data?.totalPages || 0,
    error: null,
  };
};


// ================================
// PRODUCTS
// ================================

export const getProducts = async (
  page = 1,
  perPage = API_CONFIG.perPage,
  params = ''
) => {

  return productListFetch({
    page,
    per_page: perPage,
    orderby: 'date',
    order: 'desc',
    ...toQueryObject(params),
  });

};


export const getProduct = async (id) => {

  return apiFetch(`/api/mobile/products/${id}`);

};


export const searchProducts = async (query, page = 1) => {

  return productListFetch({
    search: query,
    page,
    per_page: API_CONFIG.perPage,
  });

};


export const getProductsByCategory = async (categoryId, page = 1) => {

  return productListFetch({
    category: categoryId,
    page,
    per_page: API_CONFIG.perPage,
  });

};


export const getFeaturedProducts = async () => {

  return productListFetch({
    featured: true,
    per_page: 10,
  });

};


export const getOnSaleProducts = async (page = 1) => {

  return productListFetch({
    on_sale: true,
    page,
    per_page: API_CONFIG.perPage,
  });

};


export const getTopRatedProducts = async () => {

  return productListFetch({
    orderby: 'rating',
    order: 'desc',
    per_page: 10,
  });

};


export const getLatestProducts = async () => {

  return productListFetch({
    orderby: 'date',
    order: 'desc',
    per_page: 10,
  });

};



// ================================
// CATEGORIES
// ================================

export const getCategories = async (params = '') => {

  return apiFetch(
    '/api/mobile/categories',
    `per_page=100&orderby=count&order=desc&hide_empty=true${params ? '&' + params : ''}`
  );

};


export const getParentCategories = async () => {

  return apiFetch(
    '/api/mobile/categories',
    `parent=0&per_page=50&orderby=count&order=desc&hide_empty=true`
  );

};


export const getSubCategories = async (parentId) => {

  return apiFetch(
    '/api/mobile/categories',
    `parent=${parentId}&per_page=50&hide_empty=true`
  );

};



// ================================
// REVIEWS
// ================================

export const getProductReviews = async (productId) => {

  const res = await apiFetch('/api/product-reviews', { productId });
  if (res.error) return res;

  return { data: res.data?.reviews || [], error: null };

};


export const submitProductReview = async (productId, reviewData) => {

  const res = await apiPost('/api/product-reviews', {
    productId,
    review: reviewData.review,
    rating: reviewData.rating,
  });

  if (res.error) return res;

  return { data: res.data?.review || null, error: null };

};



// ================================
// COUPONS
// ================================

export const validateCoupon = async (code) => {

  return apiFetch(
    '/api/mobile/coupons',
    `code=${encodeURIComponent(code)}`
  );

};



// ================================
// ORDERS
// ================================

export const createOrder = async (orderData) => {

  const res = await apiPost('/api/checkout', orderData);
  if (res.error) return res;

  return { data: res.data?.order || null, error: null };

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
