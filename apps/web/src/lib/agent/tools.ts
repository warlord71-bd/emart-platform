import { tool } from 'ai';
import { z } from 'zod';
import { STORE_POLICIES } from '@/config/storePolicies';
import { COMPANY } from '@/lib/companyProfile';
import type { QdrantPayload } from '@/lib/qdrant';

const EMBED_URL = 'http://127.0.0.1:8077/embed';
const QDRANT_URL = 'http://127.0.0.1:6333';
const QDRANT_KEY = process.env.QDRANT_API_KEY || '';

async function embedAndSearch(query: string, limit: number): Promise<QdrantPayload[]> {
  try {
    const embedRes = await fetch(EMBED_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: query }),
    });
    if (!embedRes.ok) return [];
    const { vector } = await embedRes.json() as { vector: number[] };

    const searchRes = await fetch(`${QDRANT_URL}/collections/emart_products/points/search`, {
      method: 'POST',
      headers: { 'api-key': QDRANT_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vector,
        limit,
        with_payload: true,
        score_threshold: 0.35,
        filter: { must: [{ key: 'stock_status', match: { value: 'instock' } }] },
      }),
    });
    if (!searchRes.ok) return [];
    const data = await searchRes.json();
    return (data.result || []).map((r: { payload: QdrantPayload }) => r.payload);
  } catch {
    return [];
  }
}

export const agentTools = {
  searchProducts: tool({
    description:
      'Search the Emart skincare catalog by text query. Returns matching products with name, price, stock, and link. Call when the customer asks about products, availability, or wants recommendations.',
    parameters: z.object({
      query: z.string().describe('Search query (product name, brand, category, ingredient, or concern)'),
      limit: z.number().optional().default(5).describe('Max results to return'),
    }),
    execute: async ({ query, limit }) => {
      const { searchByText } = await import('@/lib/qdrantSearch');

      // Run payload text search + vector search in parallel
      const [textResults, vectorResults] = await Promise.all([
        searchByText(query, limit),
        embedAndSearch(query, limit + 3),
      ]);

      // Merge and dedupe by product_id — text matches first (exact), then vector (semantic)
      const seen = new Set<number>();
      const merged: { name: string; slug: string; price: string; stock_status: string; brand: string; category: string }[] = [];

      for (const p of [...textResults, ...vectorResults]) {
        if (seen.has(p.product_id)) continue;
        seen.add(p.product_id);
        merged.push({
          name: p.name,
          slug: p.slug,
          price: `৳${p.price_bdt}`,
          stock_status: p.stock_status,
          brand: p.brand,
          category: p.category,
        });
      }

      if (merged.length) {
        return {
          found: merged.length,
          products: merged.slice(0, limit),
        };
      }

      // Final fallback: WooCommerce keyword search
      const { getProducts } = await import('@/lib/woocommerce');
      const { products } = await getProducts({ search: query, per_page: limit, status: 'publish' });
      if (!products.length) return { found: 0, message: 'No products found for that query.' };
      return {
        found: products.length,
        products: products.map((p) => ({
          name: p.name,
          slug: p.slug,
          price: `৳${p.price}`,
          stock_status: p.stock_status,
          brand: p.brands?.[0]?.name || '',
          categories: p.categories?.map((c) => c.name).join(', '),
        })),
      };
    },
  }),

  getProductDetails: tool({
    description:
      'Get full details for a specific product including price, stock, ingredients, description, and reviews. Call when the customer asks about a specific product.',
    parameters: z.object({
      slug: z.string().optional().describe('Product URL slug'),
      product_id: z.number().optional().describe('Product ID'),
    }),
    execute: async ({ slug, product_id }) => {
      const { getProduct, getProductById, getProductReviews } = await import('@/lib/woocommerce');
      const product = slug ? await getProduct(slug) : product_id ? await getProductById(product_id) : null;
      if (!product) return { error: 'Product not found.' };

      const reviews = await getProductReviews(product.id);
      const getMeta = (key: string) => product.meta_data?.find((m) => m.key === key)?.value;
      const ingredients = getMeta('_emart_ingredients');
      const howToUse = getMeta('_emart_how_to_use');

      return {
        name: product.name,
        slug: product.slug,
        price: `৳${product.price}`,
        regular_price: product.regular_price ? `৳${product.regular_price}` : undefined,
        on_sale: product.on_sale,
        stock_status: product.stock_status,
        brand: product.brands?.[0]?.name || '',
        categories: product.categories?.map((c) => c.name).join(', '),
        short_description: product.short_description?.replace(/<[^>]+>/g, '').trim().slice(0, 500),
        ingredients: ingredients ? String(ingredients).replace(/<[^>]+>/g, '').trim().slice(0, 500) : undefined,
        how_to_use: howToUse ? String(howToUse).replace(/<[^>]+>/g, '').trim().slice(0, 300) : undefined,
        rating: product.average_rating,
        rating_count: product.rating_count,
        recent_reviews: reviews.slice(0, 3).map((r) => ({
          rating: r.rating,
          reviewer: r.reviewer,
          review: r.review?.replace(/<[^>]+>/g, '').trim().slice(0, 200),
        })),
        link: `https://e-mart.com.bd/shop/${product.slug}`,
      };
    },
  }),

  trackOrder: tool({
    description:
      'Look up order status, tracking, and delivery timeline. Requires the order number AND the customer email or phone number for identity verification. Always ask the customer for both before calling this tool.',
    parameters: z.object({
      order_id: z.number().describe('The order number'),
      identity: z.string().describe('Customer email address or phone number for verification'),
    }),
    execute: async ({ order_id, identity }) => {
      const { getOrder, getOrderNotes } = await import('@/lib/woocommerce');
      const order = await getOrder(order_id);
      if (!order) return { error: 'Order not found.' };

      const normalizedIdentity = identity.trim().toLowerCase();
      const normalizedPhone = identity.replace(/\D+/g, '');
      const billingEmail = (order.billing?.email || '').trim().toLowerCase();
      const billingPhone = (order.billing?.phone || '').replace(/\D+/g, '');

      const authorized =
        (normalizedIdentity && normalizedIdentity === billingEmail) ||
        (normalizedPhone && normalizedPhone === billingPhone);

      if (!authorized) return { error: 'Could not verify identity. Please check your email or phone number.' };

      const notes = await getOrderNotes(order_id);
      const getMeta = (key: string) => order.meta_data?.find((m) => m.key === key)?.value;

      const statusLabels: Record<string, string> = {
        pending: 'Order Placed',
        processing: 'Processing',
        'on-hold': 'Ready to Ship',
        completed: 'Delivered',
        cancelled: 'Cancelled',
        failed: 'Payment Failed',
        refunded: 'Refunded',
      };

      return {
        order_id: order.id,
        status: statusLabels[order.status] || order.status,
        date_placed: order.date_created,
        total: `৳${order.total}`,
        payment_method: order.payment_method_title,
        items: order.line_items?.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          total: `৳${item.total}`,
        })),
        shipping_address: order.shipping
          ? `${order.shipping.address_1}, ${order.shipping.city}`
          : undefined,
        tracking: {
          courier: String(getMeta('_emart_courier_name') || ''),
          tracking_code: String(getMeta('_emart_tracking_code') || ''),
          tracking_url: String(getMeta('_emart_tracking_url') || ''),
          estimated_delivery: String(getMeta('_emart_estimated_delivery') || ''),
        },
        recent_updates: notes
          ?.filter((n) => n.customer_note || /tracking|courier|status|delivered|processing|shipped/i.test(n.note))
          .slice(0, 5)
          .map((n) => ({
            date: n.date_created,
            note: n.note?.replace(/<[^>]+>/g, '').trim(),
          })),
      };
    },
  }),

  getShippingQuote: tool({
    description:
      'Calculate the shipping cost and delivery estimate for a given city and cart subtotal. Call when the customer asks about delivery fees, shipping time, or free shipping.',
    parameters: z.object({
      city: z.string().describe('The delivery city name'),
      subtotal: z.number().optional().default(0).describe('Cart subtotal in BDT (use 0 if unknown)'),
    }),
    execute: async ({ city, subtotal }) => {
      const { getShippingQuote } = await import('@/lib/woocommerce');
      const quote = await getShippingQuote(city, subtotal);
      return {
        city,
        delivery_fee: quote.isFree ? 'Free' : `৳${quote.total}`,
        method: quote.methodTitle,
        estimated_delivery: city.toLowerCase().includes('dhaka')
          ? '1–2 business days'
          : '3–5 business days',
        free_shipping_available: quote.freeShippingEnabled,
        free_shipping_threshold: quote.freeShippingThreshold
          ? `৳${quote.freeShippingThreshold}`
          : null,
        note: quote.isFree
          ? 'This order qualifies for free shipping!'
          : quote.freeShippingEnabled && quote.freeShippingThreshold
            ? `Add ৳${quote.freeShippingThreshold - subtotal} more to get free shipping.`
            : undefined,
      };
    },
  }),

  getStorePolicy: tool({
    description:
      'Retrieve store policy details: return policy, shipping policy, or privacy policy. Call when the customer asks about returns, refunds, exchanges, shipping rules, or privacy.',
    parameters: z.object({
      policy_type: z.enum(['return', 'shipping', 'privacy']).describe('Which policy to retrieve'),
    }),
    execute: async ({ policy_type }) => {
      if (policy_type === 'return') {
        return {
          policy: 'Return Policy',
          details: {
            return_window: STORE_POLICIES.returns.returnWindow,
            accepted_returns: STORE_POLICIES.returns.acceptedReturns,
            exchanges: STORE_POLICIES.returns.exchanges,
            product_condition: STORE_POLICIES.returns.productCondition,
            return_method: STORE_POLICIES.returns.returnMethod,
            courier_cost: STORE_POLICIES.returns.returnCourierCost,
            restocking_fee: STORE_POLICIES.returns.restockingFee,
            refund_processing: STORE_POLICIES.returns.refundProcessingTime,
          },
          link: 'https://e-mart.com.bd/return-policy',
        };
      }
      if (policy_type === 'shipping') {
        return {
          policy: 'Shipping Policy',
          details: {
            dhaka: `${STORE_POLICIES.shipping.dhakaDelivery}, ৳${STORE_POLICIES.shipping.dhakaShippingFee}`,
            outside_dhaka: `${STORE_POLICIES.shipping.outsideDhakaDelivery}, ৳${STORE_POLICIES.shipping.outsideDhakaShippingFee}`,
            free_shipping: `Orders over ৳${STORE_POLICIES.shipping.freeShippingThreshold}`,
            cod: 'Available across Bangladesh',
            order_cutoff: STORE_POLICIES.shipping.orderCutoff,
          },
          link: 'https://e-mart.com.bd/shipping-policy',
        };
      }
      return {
        policy: 'Privacy Policy',
        summary: 'Emart uses SSL/TLS encryption. Personal data shared only with courier/payment partners. Customers can request data access, correction, or deletion.',
        link: 'https://e-mart.com.bd/privacy-policy',
      };
    },
  }),

  recommendByProfile: tool({
    description:
      'Recommend skincare products based on skin type and concerns. Call when the customer asks for personalized product recommendations or a skincare routine.',
    parameters: z.object({
      skin_type: z.enum(['oily', 'combination', 'dry', 'sensitive', 'normal']).describe('Customer skin type'),
      concerns: z.array(z.string()).describe('Skin concerns like acne, dryness, brightening, anti-aging'),
    }),
    execute: async ({ skin_type, concerns }) => {
      const { getProducts } = await import('@/lib/woocommerce');
      const concernKeywords: Record<string, string[]> = {
        acne: ['acne', 'blemish', 'salicylic', 'tea tree', 'centella'],
        dryness: ['hydrating', 'moisturizing', 'hyaluronic', 'ceramide'],
        brightening: ['vitamin c', 'niacinamide', 'brightening', 'glow'],
        'anti-aging': ['retinol', 'peptide', 'anti-aging', 'collagen', 'wrinkle'],
        sensitivity: ['sensitive', 'gentle', 'calming', 'soothing', 'centella'],
        melasma: ['melasma', 'dark spot', 'pigmentation', 'tranexamic'],
        pores: ['pore', 'oil control', 'mattifying', 'bha'],
      };

      const searchTerms = concerns
        .flatMap((c) => concernKeywords[c.toLowerCase()] || [c])
        .slice(0, 3);

      const results = await Promise.all(
        searchTerms.map((term) => getProducts({ search: term, per_page: 3, status: 'publish' })),
      );

      const seen = new Set<number>();
      const recommended = results
        .flatMap((r) => r.products)
        .filter((p) => {
          if (seen.has(p.id) || p.stock_status !== 'instock') return false;
          seen.add(p.id);
          return true;
        })
        .slice(0, 6);

      if (!recommended.length) {
        return { message: 'No specific matches found. Browse our full catalog at https://e-mart.com.bd/shop' };
      }

      return {
        skin_type,
        concerns,
        recommended: recommended.map((p) => ({
          name: p.name,
          price: `৳${p.price}`,
          brand: p.brands?.[0]?.name || '',
          category: p.categories?.[0]?.name || '',
          link: `https://e-mart.com.bd/shop/${p.slug}`,
        })),
        browse_more: 'https://e-mart.com.bd/shop',
      };
    },
  }),

  escalateToHuman: tool({
    description:
      'Transfer the conversation to a human support agent. Call when: the customer explicitly asks for a human, the issue requires order modification/cancellation/refund, the customer is frustrated, or you cannot resolve the issue.',
    parameters: z.object({
      reason: z.string().describe('Brief reason for escalation'),
      summary: z.string().describe('Summary of the conversation so far for the human agent'),
    }),
    execute: async ({ reason, summary }) => {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;

      if (botToken && chatId) {
        const message = `🆘 *Customer Care Escalation*\n\n*Reason:* ${reason}\n\n*Summary:* ${summary}\n\n_Please follow up via support@e-mart.com.bd or WhatsApp._`;
        try {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: message,
              parse_mode: 'Markdown',
            }),
          });
        } catch {
          // Telegram notification failed silently — human will still see escalation status
        }
      }

      return {
        escalated: true,
        message: `Your request has been forwarded to our support team. They will contact you shortly via email (${COMPANY.supportEmail}) or WhatsApp (+${COMPANY.phones.primaryHref?.replace('+', '')}).`,
        support_email: COMPANY.supportEmail,
        support_whatsapp: `https://wa.me/${COMPANY.phones.primaryHref?.replace('+', '')}`,
        office_hours: COMPANY.officeHours,
      };
    },
  }),
};
