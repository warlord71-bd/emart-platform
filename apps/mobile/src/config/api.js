// Public Emart API configuration.
// Mobile must use server-side BFF routes and must never ship Woo credentials.
const BASE_URL = (
  process.env.EXPO_PUBLIC_EMART_API_URL ||
  process.env.REACT_APP_EMART_API_URL ||
  'https://e-mart.com.bd'
).replace(/\/$/, '');

export const API_CONFIG = {
  baseUrl: BASE_URL,

  // Pagination
  perPage: 20,

  // Image placeholder
  placeholderImage: 'https://e-mart.com.bd/wp-content/uploads/woocommerce-placeholder.png',
};
