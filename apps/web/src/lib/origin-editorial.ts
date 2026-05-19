export interface OriginEditorial {
  country: string; // matches pa_origin slug
  heroLine: string;
  whySection: {
    heading: string;
    body: string;
  };
  keyTrends: Array<{ title: string; description: string }>;
  popularBrands: Array<{ name: string; slug: string }>;
  bangladeshContext: string;
  faq: Array<{ q: string; a: string }>;
}

export const ORIGIN_EDITORIAL: OriginEditorial[] = [
  {
    country: 'south-korea',
    heroLine: 'The world\'s most innovative skincare — now available in Bangladesh with authentic guarantee.',
    whySection: {
      heading: 'Why Korean Skincare?',
      body:
        'Korean beauty (K-beauty) is built on a core philosophy: skincare first, makeup second. Korean brands invest heavily in ingredient research, fermentation technology, and skin science — producing formulas that are often gentler, more effective, and better suited to Asian skin tones than Western alternatives. Brands like COSRX, Beauty of Joseon, Anua, and Skin1004 have won global audiences because they work — especially for oily, acne-prone, and humid-climate skin common across South and Southeast Asia, including Bangladesh.',
    },
    keyTrends: [
      {
        title: 'Low pH Cleansing',
        description:
          'Korean cleansers preserve the skin\'s natural acid mantle (pH 4.5–5.5), preventing barrier damage and reducing breakouts. This is especially beneficial for Bangladesh\'s oily, acne-prone skin types.',
      },
      {
        title: 'Essence + Layering',
        description:
          'The Korean skincare method layers multiple thin products (toner, essence, serum, moisturiser) to deliver maximum hydration without heaviness — ideal for Bangladesh\'s humid climate.',
      },
      {
        title: 'Fermented Ingredients',
        description:
          'Fermented rice, soy, and galactomyces extracts have smaller molecular sizes that penetrate more deeply and deliver concentrated nutrients. Beauty of Joseon\'s rice-based formulas are a prime example.',
      },
      {
        title: 'Sun Protection Culture',
        description:
          'Korea\'s sunscreen culture is years ahead of most markets. Korean SPF formulas are lightweight, non-greasy, and designed for daily use in Asian climates — making them ideal for Bangladesh\'s high UV index.',
      },
      {
        title: 'Skin Barrier First',
        description:
          'K-beauty brands like COSRX and Isntree focus heavily on ceramides, centella, and beta-glucan to strengthen the skin barrier — crucial for Bangladesh\'s hard water and pollution-heavy environment.',
      },
    ],
    popularBrands: [
      { name: 'COSRX', slug: 'cosrx' },
      { name: 'Beauty of Joseon', slug: 'beauty-of-joseon' },
      { name: 'Anua', slug: 'anua' },
      { name: 'Skin1004', slug: 'skin1004' },
      { name: 'Some By Mi', slug: 'some-by-mi' },
      { name: 'Isntree', slug: 'isntree' },
      { name: 'Torriden', slug: 'torriden' },
    ],
    bangladeshContext:
      'Korean skincare is the most popular imported skincare category in Bangladesh. K-beauty dominates searches on Daraz and Facebook groups focused on skincare — and Bangladeshi influencers like Sajia Tonny and Sarah\'s Quest built their audiences around K-beauty recommendations. At Emart, 60%+ of our top 50 best-sellers are Korean-origin products. All Korean products at Emart are authenticated at import.',
    faq: [
      {
        q: 'Is Korean skincare suitable for Bangladesh\'s climate?',
        a: 'Yes. Korean skincare is developed in a humid, multi-seasonal climate similar to Bangladesh. K-beauty products are specifically engineered for oily, acne-prone, and combination skin in humid conditions — making them more suited to Dhaka\'s climate than many Western formulas.',
      },
      {
        q: 'Is Korean skincare available with Cash on Delivery in Bangladesh?',
        a: 'Yes. All Korean skincare products at Emart are available with Cash on Delivery across Bangladesh. We cover Dhaka, Chittagong, Sylhet, Rajshahi, Khulna, and all major districts.',
      },
      {
        q: 'Are Korean products at Emart authentic?',
        a: 'Yes. Emart sources Korean products directly from authorised importers and distributors with batch verification. We do not sell parallel imports or grey-market stock. Every product is checked for authenticity before listing.',
      },
      {
        q: 'How is K-beauty different from Western skincare?',
        a: 'K-beauty prioritises skin health over coverage — multi-step routines, gentle ingredients, and long-term barrier repair over quick fixes. Formulas tend to be lighter and more suitable for oily/combination skin. Korean brands also tend to have lower price points for equivalent quality.',
      },
      {
        q: 'What are the best Korean skincare brands for oily skin in Bangladesh?',
        a: 'COSRX, Anua, Skin1004, and Some By Mi are the most popular Korean brands for oily and acne-prone skin in Bangladesh. COSRX Low pH Cleanser and Beauty of Joseon Relief Sun are among Emart\'s top 5 best-sellers nationwide.',
      },
    ],
  },
  {
    country: 'japan',
    heroLine: 'Japanese skincare: precision formulation, minimalist philosophy, and 50+ years of skin science.',
    whySection: {
      heading: 'Why Japanese Skincare?',
      body:
        'Japanese beauty (J-beauty) is defined by the concept of mochi-hada — "rice cake skin" that is smooth, bouncy, and luminous. Unlike K-beauty\'s multi-step approach, J-beauty values simplicity and consistency: a few well-formulated products used daily over years. Japanese brands like Hada Labo, Biore, Shiseido, and DHC have long track records of clinical testing and are particularly trusted for sensitive skin formulations. In Bangladesh, J-beauty is the second-largest imported skincare category after K-beauty.',
    },
    keyTrends: [
      {
        title: 'Hylauronic Acid Perfection',
        description:
          'Hada Labo popularised multi-molecular hyaluronic acid layering. Japanese brands routinely include 5–7 different molecular weights of HA for maximum hydration at every skin depth.',
      },
      {
        title: 'Essence/Lotion First',
        description:
          'Japanese skincare applies a hydrating "lotion" (closer to a Western essence/toner) as the first post-cleanse step. This sets the skin\'s hydration base and helps all subsequent products absorb better.',
      },
      {
        title: 'Minimal Fragrance',
        description:
          'J-beauty brands lead the market in fragrance-free formulations for sensitive skin. Hada Labo\'s fragrance-free range is trusted by dermatologists worldwide for eczema and rosacea.',
      },
      {
        title: 'Broad Sunscreen Technology',
        description:
          'Japan\'s PA rating system (PA+, PA++, PA+++, PA++++) for UVA protection originated here. Japanese UV technology is among the most advanced in the world — producing lightweight filters that feel invisible.',
      },
    ],
    popularBrands: [
      { name: 'Hada Labo', slug: 'hada-labo' },
      { name: 'Biore', slug: 'biore' },
      { name: 'DHC', slug: 'dhc' },
      { name: 'Shiseido', slug: 'shiseido' },
      { name: 'MINON', slug: 'minon' },
    ],
    bangladeshContext:
      'Japanese skincare has a long history in Bangladesh due to regional proximity and established distribution. Biore UV sunscreens and Hada Labo moisturisers are particularly popular. At Emart, Japanese products are especially strong in the sunscreen and hydration categories — Hada Labo Gokujyun Lotion is a consistent top-seller for dry and dehydrated skin.',
    faq: [
      {
        q: 'What is the difference between Japanese and Korean skincare?',
        a: 'J-beauty (Japanese) focuses on minimalism — fewer, better products used consistently. K-beauty (Korean) focuses on layering and multi-step routines. J-beauty tends to be more conservative with actives and is trusted for sensitive skin. K-beauty is more trend-driven and innovative with new ingredients. Both work well in Bangladesh\'s climate.',
      },
      {
        q: 'Is Hada Labo available in Bangladesh with COD?',
        a: 'Yes. Hada Labo Gokujyun Lotion and other Hada Labo products are available at Emart with Cash on Delivery across Bangladesh. All products are imported from authorised sources.',
      },
      {
        q: 'Is Japanese skincare better for sensitive skin?',
        a: 'Generally yes. Japanese brands have a long tradition of fragrance-free, minimalist formulations tested for sensitive skin. Hada Labo, MINON, and DHC are among the most trusted sensitive-skin brands globally.',
      },
      {
        q: 'Are Japanese sunscreens good for oily skin in Bangladesh?',
        a: 'Yes. Japanese sunscreens, especially Biore UV Aqua Rich and Skin Aqua, are known for their lightweight, watery textures and PA++++ protection. They\'re excellent for Bangladesh\'s humid climate and are popular alternatives to Korean sunscreens.',
      },
    ],
  },
  {
    country: 'usa',
    heroLine: 'American skincare — dermatologist-backed, clinical-grade formulas trusted worldwide.',
    whySection: {
      heading: 'Why American Skincare?',
      body:
        'American skincare brands like CeraVe and The Ordinary have changed the global skincare market by making dermatologist-grade, ingredient-led formulas accessible and affordable. CeraVe was developed with dermatologists and is the #1 recommended brand by US dermatologists. The Ordinary (Canada/US) made active ingredients — retinol, niacinamide, AHAs — transparent and affordable. These brands are trusted for their science-backed, no-fluff approach.',
    },
    keyTrends: [
      {
        title: 'Ceramide-Based Barrier Repair',
        description:
          'CeraVe popularised ceramide formulations — the natural lipids that hold skin cells together. Essential for barrier-compromised skin from harsh cleansers or Bangladesh\'s hard water.',
      },
      {
        title: 'Ingredient Transparency',
        description:
          'American brands led by The Ordinary pioneered INCI-transparent marketing — listing percentages and forms of active ingredients clearly on packaging, allowing shoppers to make informed decisions.',
      },
      {
        title: 'Hyaluronic Acid Hydration',
        description:
          'CeraVe and The Ordinary both offer multi-weight hyaluronic acid serums that deliver deep hydration affordable for everyday use in Bangladesh.',
      },
    ],
    popularBrands: [
      { name: 'CeraVe', slug: 'cerave' },
      { name: 'The Ordinary', slug: 'the-ordinary' },
      { name: 'Neutrogena', slug: 'neutrogena' },
    ],
    bangladeshContext:
      'CeraVe and The Ordinary are the most trusted Western skincare brands in Bangladesh, recommended by Bangladeshi dermatologists and beauty influencers alike. They are particularly popular for sensitive, dry, and acne-prone skin that needs clinical-grade ingredient support without fragrance or unnecessary additives.',
    faq: [
      {
        q: 'Is CeraVe available in Bangladesh?',
        a: 'Yes. CeraVe Hydrating Cleanser, Foaming Cleanser, Moisturising Cream, and PM Facial Moisturising Lotion are available at Emart with Cash on Delivery across Bangladesh. All are authenticated imports.',
      },
      {
        q: 'Is The Ordinary Niacinamide 10% good for oily skin in Bangladesh?',
        a: 'Yes. The Ordinary Niacinamide 10% + Zinc 1% is one of the most effective and affordable serums for oily and acne-prone skin. It regulates sebum production and minimises pore appearance. Available at Emart with COD.',
      },
      {
        q: 'Are American skincare brands suitable for South Asian skin tones?',
        a: 'Yes. CeraVe and The Ordinary are formulated without skin-lightening agents and are safe for all skin tones. They focus on health rather than colour-correction, making them suitable and trusted in Bangladesh.',
      },
    ],
  },
];

export function getOriginEditorial(country: string): OriginEditorial | undefined {
  return ORIGIN_EDITORIAL.find((e) => e.country === country);
}
