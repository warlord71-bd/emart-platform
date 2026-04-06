// WooCommerce API Configuration
// IMPORTANT: For production, move keys to environment variables

export const API_CONFIG = {
  baseUrl: 'https://e-mart.com.bd/wp-json/wc/v3',
  consumerKey: 'ck_89c750a6f193609e73a672d84d28662783028a79',
  consumerSecret: 'cs_b6f0924fbc7dc9a10c328faee72feb29dc422279',
  
  // Pagination
  perPage: 20,
  
  // Image placeholder
  placeholderImage: 'https://e-mart.com.bd/wp-content/uploads/woocommerce-placeholder.png',
};

// Build auth query string
export const getAuthParams = () => {
  return `consumer_key=${API_CONFIG.consumerKey}&consumer_secret=${API_CONFIG.consumerSecret}`;
};
