// src/lib/woocommerce.ts
// WooCommerce REST API v3 Client for E-Mart BD

import axios from 'axios';

const WOO_URL = process.env.NEXT_PUBLIC_WOO_URL || 'https://e-mart.com.bd';
const CONSUMER_KEY = process.env.WOO_CONSUMER_KEY || '';
const CONSUMER_SECRET = process.env.WOO_CONSUMER_SECRET || '';

// ── API Client ──
const wooClient = axios.create({
  baseURL: `${WOO_URL}/wp-json/wc/v3`,
  auth: {
    username: CONSUMER_KEY,
    password: CONSUMER_SECRET,
  },
  timeout: 15000,
});

// ══════════════════════════════
// TYPES
// ══════════════════════════════
export interface WooProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  purchasable: boolean;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity: number | null;
  description: string;
  short_description: string;
  images: WooImage[];
  categories: WooCategory[];
  tags: WooTag[];
  attributes: WooAttribute[];
  average_rating: string;
  rating_count: number;
  featured: boolean;
}

export interface WooImage {
  id: number;
  src: string;
  name: string;
  alt: string;
}

export interface WooCategory {
  id: number;
  name: string;
  slug: string;
  image?: WooImage;
  count?: number;
}

export interface WooTag {
  id: number;
  name: string;
  slug: string;
}

export interface WooAttribute {
  id: number;
  name: string;
  options: string[];
}

export interface WooOrder {
  id: number;
  status: string;
  total: string;
  line_items: WooLineItem[];
  shipping: WooShipping;
  billing: WooBilling;
  date_created: string;
}

export interface WooLineItem {
  id: number;
  name: string;
  product_id: number;
  quantity: number;
  total: string;
  image?: WooImage;
}

export interface WooShipping {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2: string;
  city: string;
  postcode: string;
  country: string;
  phone: string;
}

export interface WooBilling extends WooShipping {
  email: string;
}

export interface WooCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  avatar_url: string;
}

export interface ProductsParams {
  page?: number;
  per_page?: number;
  search?: string;
  category?: string;
  tag?: string;
  orderby?: 'date' | 'price' | 'popularity' | 'rating' | 'title';
  order?: 'asc' | 'desc';
  on_sale?: boolean;
  featured?: boolean;
  min_price?: string;
  max_price?: string;
  exclude?: string;
  status?: string;
}

// ══════════════════════════════
// PRODUCTS API
// ══════════════════════════════

export async function getProducts(params: ProductsParams = {}): Promise<{
  products: WooProduct[];
  total: number;
  totalPages: number;
}> {
  try {
    const response = await wooClient.get('/products', {
      params: {
        per_page: 20,
        status: 'publish',
        ...params,
      },
    });
    return {
      products: response.data,
      total: parseInt(response.headers['x-wp-total'] || '0'),
      totalPages: parseInt(response.headers['x-wp-totalpages'] || '0'),
    };
  } catch (error) {
    console.error('getProducts error:', error);
    return { products: [], total: 0, totalPages: 0 };
  }
}

export async function getProduct(slug: string): Promise<WooProduct | null> {
  try {
    const response = await wooClient.get('/products', {
      params: { slug, status: 'publish' },
    });
    return response.data[0] || null;
  } catch (error) {
    console.error('getProduct error:', error);
    return null;
  }
}

export async function getProductById(id: number): Promise<WooProduct | null> {
  try {
    const response = await wooClient.get(`/products/${id}`);
    return response.data;
  } catch (error) {
    console.error('getProductById error:', error);
    return null;
  }
}

export async function getFeaturedProducts(limit = 8): Promise<WooProduct[]> {
  const { products } = await getProducts({ featured: true, per_page: limit });
  return products;
}

export async function getSaleProducts(limit = 8): Promise<WooProduct[]> {
  const { products } = await getProducts({ on_sale: true, per_page: limit });
  return products;
}

export async function searchProducts(query: string, page = 1): Promise<{
  products: WooProduct[];
  total: number;
  totalPages: number;
}> {
  return getProducts({ search: query, page, per_page: 20 });
}

// ══════════════════════════════
// CATEGORIES API
// ══════════════════════════════

export async function getCategories(params: {
  per_page?: number;
  parent?: number;
  hide_empty?: boolean;
} = {}): Promise<WooCategory[]> {
  try {
    const response = await wooClient.get('/products/categories', {
      params: {
        per_page: 100,
        hide_empty: true,
        orderby: 'count',
        order: 'desc',
        ...params,
      },
    });
    return response.data;
  } catch (error) {
    console.error('getCategories error:', error);
    return [];
  }
}

export async function getCategoryBySlug(slug: string): Promise<WooCategory | null> {
  try {
    const response = await wooClient.get('/products/categories', {
      params: { slug },
    });
    return response.data[0] || null;
  } catch (error) {
    console.error('getCategoryBySlug error:', error);
    return null;
  }
}

// ══════════════════════════════
// ORDERS API
// ══════════════════════════════

export async function createOrder(orderData: {
  payment_method: string;
  billing: WooBilling;
  shipping: WooShipping;
  line_items: { product_id: number; quantity: number }[];
  customer_note?: string;
}): Promise<WooOrder | null> {
  try {
    const response = await wooClient.post('/orders', {
      ...orderData,
      currency: 'BDT',
      status: 'pending',
    });
    return response.data;
  } catch (error) {
    console.error('createOrder error:', error);
    return null;
  }
}

export async function getCustomerOrders(customerId: number): Promise<WooOrder[]> {
  try {
    const response = await wooClient.get('/orders', {
      params: { customer: customerId, per_page: 20 },
    });
    return response.data;
  } catch (error) {
    console.error('getCustomerOrders error:', error);
    return [];
  }
}

// ══════════════════════════════
// CUSTOMERS API
// ══════════════════════════════

export async function getCustomer(id: number): Promise<WooCustomer | null> {
  try {
    const response = await wooClient.get(`/customers/${id}`);
    return response.data;
  } catch (error) {
    return null;
  }
}

export async function createCustomer(data: {
  email: string;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
}): Promise<WooCustomer | null> {
  try {
    const response = await wooClient.post('/customers', data);
    return response.data;
  } catch (error) {
    console.error('createCustomer error:', error);
    return null;
  }
}

// ══════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════

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

export function isInStock(product: WooProduct): boolean {
  return product.stock_status === 'instock' && product.purchasable;
}
