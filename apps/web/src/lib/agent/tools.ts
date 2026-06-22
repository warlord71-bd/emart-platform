import { tool } from 'ai';
import { z } from 'zod';
import { STORE_POLICIES } from '@/config/storePolicies';
import { COMPANY } from '@/lib/companyProfile';
import type { QdrantPayload } from '@/lib/qdrant';
import {
  AI_RERANK_TIMEOUT_MS,
  EMBED_URL,
  QDRANT_COLLECTION,
  QDRANT_KEY,
  QDRANT_URL,
  RERANK_URL,
  fetchWithTimeout,
} from '@/lib/aiServiceConfig';
import { enhanceSearchQuery } from '@/lib/search/queryEnhance';

async function rerankResults(
  query: string,
  items: { name: string; slug: string; brand: string; category: string }[],
  topK: number,
): Promise<number[]> {
  if (items.length <= 2) return items.map((_, i) => i);
  try {
    const documents = items.map((p) => `${p.name} — ${p.brand} ${p.category}`);
    const res = await fetchWithTimeout(RERANK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, documents, top_k: topK }),
    }, AI_RERANK_TIMEOUT_MS);
    if (!res.ok) return items.map((_, i) => i);
    const data = await res.json() as { results: { index: number; score: number }[] };
    return data.results.map((r) => r.index);
  } catch {
    return items.map((_, i) => i);
  }
}

async function embedAndSearch(query: string, limit: number): Promise<QdrantPayload[]> {
  try {
    const embedRes = await fetchWithTimeout(EMBED_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: query }),
    });
    if (!embedRes.ok) return [];
    const { vector } = await embedRes.json() as { vector: number[] };

    const searchRes = await fetchWithTimeout(`${QDRANT_URL}/collections/${QDRANT_COLLECTION}/points/search`, {
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
      const enhanced = enhanceSearchQuery(query);

      // Run payload text search + vector search in parallel
      const [textResults, vectorResults] = await Promise.all([
        searchByText(enhanced.expandedQuery, limit),
        embedAndSearch(enhanced.expandedQuery, limit + 3),
      ]);

      // Merge and dedupe by product_id — text matches first (exact), then vector (semantic)
      const seen = new Set<number>();
      const merged: { name: string; slug: string; price: string; stock_status: string; brand: string; category: string; image: string }[] = [];

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
          image: p.image_url || '',
        });
      }

      if (merged.length) {
        const rerankedIndices = await rerankResults(enhanced.expandedQuery, merged, limit);
        const reranked = rerankedIndices.map((i) => merged[i]).filter(Boolean);
        return {
          found: reranked.length,
          correctedQuery: enhanced.correctedQuery,
          language: enhanced.language,
          products: reranked.slice(0, limit),
        };
      }

      // Final fallback: WooCommerce keyword search
      const { getProducts } = await import('@/lib/woocommerce');
      const { products } = await getProducts({ search: enhanced.searchQuery, per_page: limit, status: 'publish' });
      if (!products.length) return { found: 0, message: 'No products found for that query.' };
      return {
        found: products.length,
        correctedQuery: enhanced.correctedQuery,
        language: enhanced.language,
        products: products.map((p) => ({
          name: p.name,
          slug: p.slug,
          price: `৳${p.price}`,
          stock_status: p.stock_status,
          brand: p.brands?.[0]?.name || '',
          category: p.categories?.map((c) => c.name).join(', '),
          image: p.images?.[0]?.src || '',
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
        image: product.images?.[0]?.src || '',
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
      'Build a personalized AM/PM skincare routine based on skin type and concerns. Returns structured morning and night steps with product recommendations. Call when the customer asks for a skincare routine, personalized recommendations, or what products to use.',
    parameters: z.object({
      skin_type: z.enum(['oily', 'combination', 'dry', 'sensitive', 'normal']).describe('Customer skin type'),
      concerns: z.array(z.string()).describe('Skin concerns like acne, dryness, brightening, anti-aging, pores, melasma, sensitivity'),
    }),
    execute: async ({ skin_type, concerns }) => {
      const { getQuizProductPoolsFromQdrant } = await import('@/lib/routineQdrant');
      const { buildSkinQuizResult } = await import('@/lib/skinQuiz');
      type SkinConcern = import('@/lib/skinQuiz').SkinConcern;

      const concernMap: Record<string, SkinConcern> = {
        acne: 'acne-blemish-care', blemish: 'acne-blemish-care',
        pores: 'pores-oil-control', 'oil control': 'pores-oil-control', oily: 'pores-oil-control',
        dryness: 'dryness-hydration', hydration: 'dryness-hydration', dry: 'dryness-hydration',
        melasma: 'melasma', 'dark spot': 'melasma', pigmentation: 'melasma',
        brightening: 'brightening', glow: 'brightening',
        sensitivity: 'sensitivity', redness: 'sensitivity', sensitive: 'sensitivity',
        'anti-aging': 'anti-aging-repair', wrinkle: 'anti-aging-repair', aging: 'anti-aging-repair',
      };

      const mappedConcerns = concerns
        .map((c) => concernMap[c.toLowerCase()])
        .filter(Boolean) as SkinConcern[];

      if (!mappedConcerns.length) mappedConcerns.push('dryness-hydration');

      const answers = {
        skinType: skin_type,
        concerns: mappedConcerns.slice(0, 3),
        environment: 'dhaka-heat' as const,
        routinePace: 'balanced' as const,
        budget: 'steady' as const,
      };

      const pools = await getQuizProductPoolsFromQdrant(answers);
      const result = buildSkinQuizResult(answers, pools);

      const formatStep = (step: { label: string; cadence: string; why: string; product: { name: string; slug: string; price: string; images: { src: string }[] } | null }) => ({
        step: step.label,
        time: step.cadence,
        why: step.why,
        product: step.product ? {
          name: step.product.name,
          slug: step.product.slug,
          price: `৳${step.product.price}`,
          image: step.product.images?.[0]?.src || '',
        } : null,
      });

      return {
        headline: result.headline,
        summary: result.summary,
        skin_type,
        concerns: mappedConcerns,
        morning: result.morning.map(formatStep),
        night: result.night.map(formatStep),
        weekly: result.weekly.map(formatStep),
        notes: result.notes,
        quiz_link: 'https://e-mart.com.bd/skin-quiz',
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

      const waNumber = COMPANY.phones.primaryHref?.replace('+', '') || '8801919797399';
      return {
        escalated: true,
        message: `Your request has been forwarded to our support team. They will contact you shortly via email (${COMPANY.supportEmail}) or [WhatsApp](https://wa.me/${waNumber}).`,
        support_email: COMPANY.supportEmail,
        support_whatsapp: `https://wa.me/${waNumber}`,
        office_hours: COMPANY.officeHours,
      };
    },
  }),
};
