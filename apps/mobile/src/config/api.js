// WooCommerce API Configuration
// SECURITY: API credentials should be set via environment variables

const BASE_URL = process.env.REACT_APP_WOO_URL || 'https://e-mart.com.bd/wp-json/wc/v3';
const CONSUMER_KEY = process.env.REACT_APP_WOO_CONSUMER_KEY || '';
const CONSUMER_SECRET = process.env.REACT_APP_WOO_CONSUMER_SECRET || '';

export const API_CONFIG = {
  baseUrl: BASE_URL,
  consumerKey: CONSUMER_KEY,
  consumerSecret: CONSUMER_SECRET,

  // Pagination
  perPage: 20,

  // Image placeholder
  placeholderImage: 'https://e-mart.com.bd/wp-content/uploads/woocommerce-placeholder.png',
};

// Build auth query string
export const getAuthParams = () => {
  if (!CONSUMER_KEY || !CONSUMER_SECRET) {
    console.warn('WooCommerce API credentials not configured. Set REACT_APP_WOO_CONSUMER_KEY and REACT_APP_WOO_CONSUMER_SECRET environment variables.');
  }
  return `consumer_key=${API_CONFIG.consumerKey}&consumer_secret=${API_CONFIG.consumerSecret}`;
};
