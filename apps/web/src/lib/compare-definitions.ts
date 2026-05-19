export interface CompareProduct {
  name: string;
  slug: string;
  price: string;
  brand: string;
  origin: string;
  type: string;
  keyIngredients: string[];
  bestFor: string[];
  texture: string;
  spf?: string;
  rating: string;
  verdict: string;
}

export interface CompareDefinition {
  pair: string; // URL slug, e.g. 'cerave-vs-cosrx-cleanser'
  title: string;
  metaTitle: string;
  description: string;
  category: string;
  concern: string;
  winner?: string; // name of winner for schema
  products: [CompareProduct, CompareProduct];
  summary: string;
  bangladeshNote: string;
  faq: Array<{ q: string; a: string }>;
}

export const COMPARE_DEFINITIONS: CompareDefinition[] = [
  {
    pair: 'cerave-vs-cosrx-cleanser',
    title: 'CeraVe Hydrating Cleanser vs COSRX Low pH Cleanser',
    metaTitle: 'CeraVe vs COSRX Cleanser: Which is Better for Bangladesh Skin?',
    description:
      'CeraVe Hydrating Facial Cleanser vs COSRX Low pH Good Morning Gel Cleanser — an honest comparison for Bangladesh shoppers. We break down ingredients, texture, price, and which one works best in Dhaka\'s humid climate.',
    category: 'Cleanser',
    concern: 'Everyday cleansing for oily, combination, or sensitive skin',
    products: [
      {
        name: 'CeraVe Hydrating Facial Cleanser',
        slug: 'cerave-hydrating-facial-cleanser-473ml',
        price: '৳1,890',
        brand: 'CeraVe',
        origin: 'USA',
        type: 'Cream/Lotion Cleanser',
        keyIngredients: ['Ceramides (1, 3, 6-II)', 'Hyaluronic Acid', 'Niacinamide'],
        bestFor: ['Dry skin', 'Sensitive skin', 'Barrier-compromised skin'],
        texture: 'Creamy, non-foaming — rinses clean without tight feeling',
        rating: '4.7/5',
        verdict:
          'Best for dry and sensitive skin types. Ceramides and hyaluronic acid restore the skin barrier while cleansing gently. No fragrance, no harsh surfactants.',
      },
      {
        name: 'COSRX Low pH Good Morning Gel Cleanser',
        slug: 'cosrx-low-ph-good-morning-gel-cleanser-150ml',
        price: '৳890',
        brand: 'COSRX',
        origin: 'South Korea',
        type: 'Gel Cleanser',
        keyIngredients: ['Tea Tree Oil', 'BHA (Betaine Salicylate)', 'Low pH formulation (pH 5.0)'],
        bestFor: ['Oily skin', 'Acne-prone skin', 'Morning cleansing'],
        texture: 'Light gel, minimal foam — leaves skin clean but not tight',
        rating: '4.6/5',
        verdict:
          'Best for oily and acne-prone skin. Low pH preserves the skin\'s acid mantle. BHA gently unclogs pores. The COSRX is more affordable and better suited to Bangladesh\'s humidity.',
      },
    ],
    summary:
      'If you have oily or acne-prone skin — the most common skin type in Bangladesh — choose the COSRX. Its low pH formulation works with your skin\'s natural acid mantle, and the light gel texture won\'t feel heavy in Dhaka\'s humidity. If you have dry, sensitive, or barrier-compromised skin, the CeraVe is the clear winner: ceramides and niacinamide in a single step, with no fragrance and proven dermatologist backing.',
    bangladeshNote:
      'Both cleansers are available at Emart with authenticity verification and Cash on Delivery. In Bangladesh\'s hot climate, gel cleansers are generally preferred for morning use regardless of skin type. The COSRX is our best-selling cleanser for oily skin; the CeraVe is the top pick for sensitive skin customers.',
    faq: [
      {
        q: 'Is CeraVe Hydrating Cleanser good for oily skin in Bangladesh?',
        a: 'CeraVe Hydrating Cleanser works but may feel slightly heavy for oily skin in Dhaka\'s humid climate. It\'s formulated for dry and normal skin. Oily skin types in Bangladesh tend to prefer the COSRX Low pH Gel Cleanser for its lighter texture and pore-clearing BHA.',
      },
      {
        q: 'Which is cheaper — CeraVe or COSRX cleanser in Bangladesh?',
        a: 'The COSRX Low pH Good Morning Gel Cleanser (150ml) is around ৳890 at Emart, while CeraVe Hydrating Facial Cleanser (473ml) is ৳1,890. Per ml, CeraVe is actually more economical, but COSRX is the lower upfront spend.',
      },
      {
        q: 'Can I use COSRX Low pH Cleanser if I have sensitive skin?',
        a: 'The COSRX Low pH Cleanser contains tea tree oil which can be sensitising for very reactive skin. If you have sensitive or rosacea-prone skin, the CeraVe Hydrating Cleanser is the safer choice — fragrance-free, no essential oils, ceramide-based.',
      },
      {
        q: 'Is CeraVe authentic at Emart?',
        a: 'Yes. Emart sources CeraVe directly from authorised distributors with batch verification. All products include authenticity documentation and are eligible for Cash on Delivery across Bangladesh.',
      },
    ],
  },
  {
    pair: 'cosrx-vs-beauty-of-joseon-sunscreen',
    title: 'COSRX Aloe Sun Cream vs Beauty of Joseon Relief Sun',
    metaTitle: 'COSRX vs Beauty of Joseon Sunscreen: Which is Better in Bangladesh?',
    description:
      'COSRX Aloe Soothing Sun Cream SPF50 vs Beauty of Joseon Relief Sun: Rice + Probiotics SPF50 PA++++ — a side-by-side review for Bangladesh shoppers who deal with heat, humidity, and oily skin.',
    category: 'Sunscreen',
    concern: 'Daily SPF protection for oily, combination, or sensitive skin',
    products: [
      {
        name: 'Beauty of Joseon Relief Sun: Rice + Probiotics',
        slug: 'beauty-of-joseon-sunscreen-rice-probiotics-spf-50-50ml',
        price: '৳1,390',
        brand: 'Beauty of Joseon',
        origin: 'South Korea',
        type: 'Chemical Sunscreen',
        keyIngredients: ['Rice Bran Water', 'Probiotics', 'Niacinamide', 'UV Filters'],
        bestFor: ['Oily skin', 'Combination skin', 'No white cast concern'],
        texture: 'Ultra-lightweight, watery-gel — absorbs instantly with no residue',
        spf: 'SPF50 PA++++',
        rating: '4.8/5',
        verdict:
          'The cult favourite in Bangladesh. Zero white cast, serum-like texture, and a mild skin-brightening effect from rice bran. Works well under makeup and in humid conditions.',
      },
      {
        name: 'COSRX Aloe Soothing Sun Cream',
        slug: 'cosrx-aloe-soothing-sun-cream-spf50-pa-50ml',
        price: '৳1,290',
        brand: 'COSRX',
        origin: 'South Korea',
        type: 'Chemical Sunscreen',
        keyIngredients: ['Aloe Vera (73%)', 'Glycerin', 'UV Filters'],
        bestFor: ['Sensitive skin', 'Dry skin', 'After-sun soothing'],
        texture: 'Creamy gel — slightly more hydrating than Beauty of Joseon',
        spf: 'SPF50 PA+++',
        rating: '4.5/5',
        verdict:
          'Better suited to dry and sensitive skin types. The high aloe content soothes and hydrates. Less matte finish than BOJ — may look slightly dewy on oily skin in Bangladesh\'s heat.',
      },
    ],
    summary:
      'For Bangladesh\'s hot, humid climate, the Beauty of Joseon Relief Sun is our recommended pick for most skin types. Its near-invisible application and zero white cast make it the country\'s most popular sunscreen. The COSRX Aloe Soothing Sun Cream is the better choice if your skin is dry or sensitive — the aloe vera base is more soothing, but the finish may feel heavier in Dhaka\'s monsoon heat.',
    bangladeshNote:
      'Sunscreen is non-negotiable in Bangladesh — year-round UV index regularly exceeds 8 (Very High). Both products are best-sellers at Emart. The Beauty of Joseon is our top-selling single skincare product overall. Cash on Delivery available across Bangladesh.',
    faq: [
      {
        q: 'Does Beauty of Joseon Relief Sun leave a white cast on dark skin tones?',
        a: 'No. Beauty of Joseon Relief Sun uses chemical UV filters and leaves virtually zero white cast, making it suitable for South Asian skin tones common in Bangladesh. This is one of the main reasons it\'s so popular.',
      },
      {
        q: 'Which sunscreen is better for oily skin in Dhaka\'s heat — BOJ or COSRX?',
        a: 'Beauty of Joseon Relief Sun is better for oily skin. Its ultra-lightweight, almost watery texture absorbs fast and doesn\'t feel greasy in humidity. The COSRX Aloe Sun Cream has a slightly heavier, more hydrating finish that works better for drier skin types.',
      },
      {
        q: 'Is SPF50 PA++++ better than SPF50 PA+++ in Bangladesh?',
        a: 'Yes — the PA++++ rating means stronger UVA protection, which matters for preventing hyperpigmentation and dark spots. In Bangladesh\'s intense sun, Beauty of Joseon\'s PA++++ is preferable for long-term anti-pigmentation protection.',
      },
      {
        q: 'Can I use these sunscreens daily without primer?',
        a: 'Both work as standalone last steps in your morning routine. Beauty of Joseon creates a smooth, slightly brightening base under makeup. COSRX leaves a more natural finish. Neither requires primer for everyday use.',
      },
    ],
  },
  {
    pair: 'cosrx-snail-vs-beauty-of-joseon-serum',
    title: 'COSRX Snail Mucin vs Beauty of Joseon Glow Serum',
    metaTitle: 'COSRX Snail 96 vs Beauty of Joseon Glow Serum: Which Serum Wins?',
    description:
      'COSRX Advanced Snail 96 Mucin Power Essence vs Beauty of Joseon Glow Deep Serum: Rice + Arbutin — a head-to-head for Bangladeshi shoppers seeking hydration, brightening, and barrier repair.',
    category: 'Serum / Essence',
    concern: 'Hydration, brightening, and barrier repair',
    products: [
      {
        name: 'COSRX Advanced Snail 96 Mucin Power Essence',
        slug: 'cosrx-advanced-snail-96-mucin-power-essence-100ml',
        price: '৳1,750',
        brand: 'COSRX',
        origin: 'South Korea',
        type: 'Essence',
        keyIngredients: ['Snail Secretion Filtrate (96%)', 'Sodium Hyaluronate'],
        bestFor: ['Dull skin', 'Post-acne repair', 'Barrier strengthening', 'Sensitive skin'],
        texture: 'Slightly viscous, gel-like — absorbs within seconds, no stickiness',
        rating: '4.8/5',
        verdict:
          'The K-beauty icon for a reason. Snail mucin accelerates skin repair, fades post-acne marks, and deeply hydrates. No fragrance, no irritants. Works on all skin types including sensitive.',
      },
      {
        name: 'Beauty of Joseon Glow Deep Serum: Rice + Arbutin',
        slug: 'beauty-of-joseon-glow-deep-serum-rice-arbutin-30-ml',
        price: '৳1,445',
        brand: 'Beauty of Joseon',
        origin: 'South Korea',
        type: 'Serum',
        keyIngredients: ['Rice Bran Water (80%)', 'Alpha-Arbutin (2%)', 'Niacinamide'],
        bestFor: ['Hyperpigmentation', 'Brightening', 'Dull skin', 'Dark spots'],
        texture: 'Lightweight watery serum — layers easily under moisturiser',
        rating: '4.7/5',
        verdict:
          'Best for brightening and hyperpigmentation. Arbutin + niacinamide target dark spots and uneven tone. More targeted than snail mucin; less focused on repair.',
      },
    ],
    summary:
      'If your main concern is post-acne marks, barrier repair, or general skin health, choose the COSRX Snail 96. It\'s a skin-repairing workhorse that works on virtually all skin types. If brightening, hyperpigmentation, or dark spots are your priority — common concerns in Bangladesh due to sun exposure — the Beauty of Joseon Glow Serum with arbutin and niacinamide is more targeted.',
    bangladeshNote:
      'Hyperpigmentation and post-acne dark spots are among the top skincare concerns in Bangladesh due to intense UV exposure. Both products are authentic and available at Emart with Cash on Delivery. Many customers use both — snail mucin for repair, BOJ serum for brightening.',
    faq: [
      {
        q: 'Can I use COSRX Snail 96 Mucin and Beauty of Joseon Glow Serum together?',
        a: 'Yes. Layer them after cleansing and toning: apply the BOJ Glow Serum first (it\'s thinner), then the COSRX Snail Mucin. Both are fragrance-free and compatible. This combination targets both brightening and skin repair simultaneously.',
      },
      {
        q: 'Does snail mucin help with acne marks in Bangladesh?',
        a: 'Yes. Snail secretion filtrate contains glycoproteins, hyaluronic acid, and glycolic acid that accelerate cell turnover and fade post-inflammatory hyperpigmentation (PIH). It\'s one of the most effective affordable ingredients for acne marks in Bangladesh\'s climate.',
      },
      {
        q: 'Is alpha-arbutin safe for all skin tones?',
        a: 'Yes. Alpha-arbutin is a gentle, skin-safe brightening ingredient derived from bearberry. It works by inhibiting melanin production without irritation. It\'s safe for all South Asian skin tones and widely used in Bangladesh for hyperpigmentation treatment.',
      },
      {
        q: 'Which is better for dark spots — snail mucin or arbutin serum?',
        a: 'Arbutin (Beauty of Joseon Glow Serum) is more directly targeted at dark spots and hyperpigmentation. Snail mucin (COSRX) helps fade marks over time but works more broadly on skin repair. For visible dark spots, start with arbutin.',
      },
    ],
  },
];

export function getCompareByPair(pair: string): CompareDefinition | undefined {
  return COMPARE_DEFINITIONS.find((c) => c.pair === pair);
}
