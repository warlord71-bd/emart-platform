export interface SkinTypeDefinition {
  slug: string;
  name: string;
  nameBn: string;
  tagline: string;
  description: string;
  characteristics: string[];
  concerns: string[];
  keyIngredients: string[];
  ingredientsToAvoid: string[];
  routine: {
    am: string[];
    pm: string[];
  };
  climateTips: string;
  commonMistakes: string[];
  relatedConcerns: Array<{ slug: string; label: string }>;
  relatedIngredients: Array<{ slug: string; label: string }>;
  faq: Array<{ q: string; a: string }>;
}

export const SKIN_TYPE_DEFINITIONS: SkinTypeDefinition[] = [
  {
    slug: 'oily',
    name: 'Oily Skin',
    nameBn: 'তৈলাক্ত ত্বক',
    tagline: 'Control shine, balance oil, keep skin healthy in Bangladesh\'s humidity',
    description: 'Oily skin produces excess sebum — the natural oil your skin needs — but too much of it leads to shine, enlarged pores, and frequent breakouts. In Bangladesh\'s hot, humid climate, oily skin is the most common skin type, particularly in Dhaka where heat and pollution combine to overstimulate oil glands throughout the year.',
    characteristics: [
      'Visible shine across forehead, nose, and chin (T-zone) throughout the day',
      'Enlarged or visibly noticeable pores, especially on nose and cheeks',
      'Frequent blackheads and whiteheads from clogged pores',
      'Makeup tends to slide or break down within hours',
      'Skin feels greasy by mid-morning even after cleansing',
      'Prone to acne and blemishes, especially in summer and monsoon',
    ],
    concerns: ['acne-blemish-care', 'pores-oil-control', 'brightening'],
    keyIngredients: ['niacinamide', 'bha-salicylic-acid', 'hyaluronic-acid', 'centella', 'snail-mucin'],
    ingredientsToAvoid: ['heavy mineral oils', 'coconut oil (comedogenic)', 'thick occlusive creams', 'alcohol-heavy toners that strip moisture'],
    routine: {
      am: [
        'Gentle low-pH gel cleanser (COSRX Low pH Good Morning Gel Cleanser)',
        'Lightweight hydrating toner (Anua Heartleaf 77% Soothing Toner)',
        'Niacinamide serum for oil control (The Ordinary Niacinamide 10% + Zinc)',
        'Oil-free gel moisturiser',
        'Non-comedogenic SPF50 sunscreen — essential in Bangladesh (Beauty of Joseon Relief Sun)',
      ],
      pm: [
        'Oil cleanser or micellar water to remove sunscreen',
        'Gentle gel cleanser for second cleanse',
        'BHA exfoliant 2–3x weekly (COSRX BHA Blackhead Power Liquid)',
        'Niacinamide or centella serum',
        'Lightweight gel moisturiser — skip heavy cream',
      ],
    },
    climateTips: 'Bangladesh\'s year-round humidity means oily skin faces a constant challenge. In Dhaka\'s monsoon (June–September), heat and moisture push oil production into overdrive. Use water-based, non-comedogenic products only. Avoid skipping moisturiser — dehydrated oily skin overproduces oil to compensate. Blotting papers are your best midday friend. Always apply sunscreen: UV exposure worsens hyperpigmentation from breakouts, which is especially visible on South Asian skin tones.',
    commonMistakes: [
      'Over-cleansing — washing 3+ times a day strips the skin barrier and triggers more oil production',
      'Skipping moisturiser — oily skin still needs hydration; use a gel-based formula',
      'Using harsh alcohol toners — these damage the barrier and cause rebound oiliness',
      'Skipping sunscreen — heavy sunscreen worsens oiliness, but lightweight mineral SPF is non-negotiable',
      'Relying on face powder alone to control shine instead of treating the root cause with skincare',
    ],
    relatedConcerns: [
      { slug: 'acne-blemish-care', label: 'Acne & Blemish Care' },
      { slug: 'pores-oil-control', label: 'Pores & Oil Control' },
      { slug: 'brightening', label: 'Brightening' },
    ],
    relatedIngredients: [
      { slug: 'niacinamide', label: 'Niacinamide' },
      { slug: 'bha-salicylic-acid', label: 'BHA / Salicylic Acid' },
      { slug: 'centella', label: 'Centella Asiatica' },
    ],
    faq: [
      { q: 'Is oily skin common in Bangladesh?', a: 'Yes — oily skin is the most common skin type in Bangladesh. Dhaka\'s high year-round humidity (averaging 70–85%) and heat stimulate excess sebum production. If your skin looks shiny by mid-morning and you get frequent breakouts, you likely have oily or combination-oily skin.' },
      { q: 'Should I use moisturiser if I have oily skin?', a: 'Absolutely. Skipping moisturiser causes your skin to overproduce oil to compensate for dehydration. Choose a lightweight, oil-free gel moisturiser with hyaluronic acid or centella. Products like COSRX Centella Blemish Ampule or Skin1004 Madagascar Centella Hyalu-Cica Moisturizer work well for oily skin in Bangladesh\'s climate.' },
      { q: 'Which sunscreen is best for oily skin in Bangladesh?', a: 'Choose non-comedogenic, lightweight sunscreens with a matte or dry-touch finish. Beauty of Joseon Relief Sun: Rice + Probiotics SPF50 PA++++, Anua Heartleaf Daily Sun Cream, and COSRX Aloe Soothing Sun Cream are popular choices among Bangladeshi shoppers with oily skin. Avoid thick, white-cast mineral sunscreens.' },
      { q: 'Does niacinamide help with oily skin?', a: 'Yes. Niacinamide (Vitamin B3) regulates sebum production, minimises the appearance of pores, and reduces shine over time. The Ordinary Niacinamide 10% + Zinc is one of the most popular products for oily skin in Bangladesh and is available at Emart with authentic certification and Cash on Delivery.' },
      { q: 'How do I control oily skin during Dhaka\'s monsoon season?', a: 'During monsoon, focus on a simplified routine: low-pH gel cleanser → lightweight toner → niacinamide serum → oil-free sunscreen. Remove sunscreen properly at night with micellar water. Use BHA exfoliant 2–3 times per week to prevent clogged pores. Blotting papers help during the day without disturbing sunscreen.' },
    ],
  },
  {
    slug: 'acne-prone',
    name: 'Acne-Prone Skin',
    nameBn: 'ব্রণপ্রবণ ত্বক',
    tagline: 'Science-backed acne care without harmful ingredients — safe for Bangladesh\'s climate',
    description: 'Acne-prone skin is not a skin type in itself but a skin condition that can occur with oily, combination, or even dry skin. In Bangladesh, acne is one of the most common skincare concerns, driven by heat, humidity, pollution, hard water, dietary habits, and hormonal factors. Both Sajia Tonny and Sarah\'s Quest consistently report that acne-related questions dominate their audience\'s concerns.',
    characteristics: [
      'Frequent papules, pustules, blackheads, or whiteheads',
      'Post-acne marks and hyperpigmentation that linger for months on South Asian skin',
      'Skin feels congested or rough in texture',
      'Pores appear enlarged and blocked',
      'Breakouts worsen in summer, monsoon, or during stress',
      'Skin may be oily in some areas and dry/irritated in others from harsh acne products',
    ],
    concerns: ['acne-blemish-care', 'pores-oil-control', 'brightening', 'sensitivity'],
    keyIngredients: ['niacinamide', 'bha-salicylic-acid', 'centella', 'snail-mucin', 'aha'],
    ingredientsToAvoid: ['comedogenic oils (coconut, palm)', 'harsh alcohol', 'physical scrubs', 'whitening creams with unverified ingredients'],
    routine: {
      am: [
        'Gentle low-pH gel cleanser — no foaming sulfates',
        'Centella or cica toner to calm inflammation',
        'Niacinamide serum — controls sebum, fades marks',
        'Lightweight non-comedogenic moisturiser',
        'Non-comedogenic SPF50 — mandatory to prevent post-acne marks from darkening',
      ],
      pm: [
        'Oil cleanser to remove pollution + sunscreen',
        'Gentle gel second cleanse',
        'BHA (salicylic acid) 2–3x per week — unclogs pores',
        'Centella ampoule or snail mucin on active breakouts',
        'Lightweight gel moisturiser',
      ],
    },
    climateTips: 'Bangladesh\'s polluted air in Dhaka city clogs pores and worsens acne. Double cleanse every evening to remove pollution. Monsoon humidity makes sweat mix with sebum — cleanse after heavy sweating. Avoid whitening creams marketed in Bangladesh that contain mercury, hydroquinone, or unverified steroids — these can cause steroid acne and worsen existing breakouts. Trust science-backed ingredients like niacinamide, BHA, and centella instead.',
    commonMistakes: [
      'Using harsh, drying products that damage the barrier and cause more breakouts',
      'Popping pimples — this spreads bacteria and creates deeper post-acne marks',
      'Using whitening creams with unverified ingredients — a major issue flagged by Sajia Tonny',
      'Skipping sunscreen — UV exposure turns post-acne marks into permanent dark spots on South Asian skin',
      'Using coconut oil as a moisturiser — highly comedogenic and worsens acne',
    ],
    relatedConcerns: [
      { slug: 'acne-blemish-care', label: 'Acne & Blemish Care' },
      { slug: 'pores-oil-control', label: 'Pores & Oil Control' },
      { slug: 'brightening', label: 'Post-Acne Brightening' },
    ],
    relatedIngredients: [
      { slug: 'niacinamide', label: 'Niacinamide' },
      { slug: 'bha-salicylic-acid', label: 'BHA / Salicylic Acid' },
      { slug: 'centella', label: 'Centella Asiatica' },
      { slug: 'snail-mucin', label: 'Snail Mucin' },
    ],
    faq: [
      { q: 'What causes acne in Bangladesh\'s climate?', a: 'In Bangladesh, acne is commonly triggered by excess sebum from humidity, pollution clogging pores, hard water disrupting the skin barrier, and hormonal fluctuations. Sweating in Dhaka\'s heat mixes with sebum and bacteria on the skin surface, creating ideal conditions for breakouts. A consistent, gentle routine using proven ingredients like BHA and niacinamide is the evidence-based solution.' },
      { q: 'Is COSRX good for acne-prone skin in Bangladesh?', a: 'COSRX is one of the most trusted brands for acne-prone skin in Bangladesh. Their Low pH Good Morning Gel Cleanser, BHA Blackhead Power Liquid, and Acne Pimple Master Patches are particularly popular. COSRX uses minimal, functional formulas without irritating fragrances. All COSRX products at Emart are authentic imports.' },
      { q: 'Can I use retinol for acne?', a: 'Retinol (vitamin A) is effective for acne as it speeds up cell turnover and prevents clogged pores. However, start slowly — use 0.1–0.25% retinol 2x per week at night, always follow with moisturiser, and always use SPF the next morning. Bangladesh\'s humid climate makes retinol more tolerable than in dry climates, but sun protection is even more essential here.' },
      { q: 'How do I fade acne marks (post-inflammatory hyperpigmentation)?', a: 'Post-acne marks on South Asian skin can be persistent. Use niacinamide daily to inhibit melanin transfer, add a vitamin C serum in the morning for brightening, and apply SPF religiously — UV exposure darkens marks significantly. Patience is key: most marks fade in 2–4 months with consistent use. Products like The Ordinary Niacinamide 10% + Zinc and COSRX Snail Mucin Essence help speed recovery.' },
      { q: 'Are whitening creams safe for acne in Bangladesh?', a: 'Many whitening creams marketed in Bangladesh contain undisclosed steroids, mercury, or hydroquinone — all of which can cause steroid-induced acne, skin thinning, and permanent damage. Experts like Sajia Tonny strongly advise against them. Instead, choose science-backed brightening ingredients: niacinamide, vitamin C, and alpha-arbutin, all available in authenticated products at Emart.' },
    ],
  },
  {
    slug: 'dry',
    name: 'Dry Skin',
    nameBn: 'শুষ্ক ত্বক',
    tagline: 'Deep hydration and barrier repair for dry skin in any season',
    description: 'Dry skin produces less sebum than normal skin, leaving it feeling tight, rough, and sometimes flaky. In Bangladesh, dry skin is less common than oily skin but becomes more noticeable during winter (November–February) and in air-conditioned environments. Hard water in Dhaka can also strip the skin barrier and make dry skin worse.',
    characteristics: [
      'Skin feels tight, especially after cleansing',
      'Rough or flaky patches, particularly around the nose and cheeks',
      'Fine lines appear more pronounced due to lack of moisture',
      'Dull, lacklustre complexion',
      'Skin may feel uncomfortable or itchy in AC environments',
      'Pores appear smaller than normal; skin rarely looks shiny',
    ],
    concerns: ['dryness-hydration', 'sensitivity', 'anti-aging-repair'],
    keyIngredients: ['hyaluronic-acid', 'ceramide', 'snail-mucin', 'peptide', 'collagen'],
    ingredientsToAvoid: ['harsh foaming cleansers (SLS/SLES)', 'alcohol-heavy toners', 'strong AHA/BHA without barrier support', 'mattifying products'],
    routine: {
      am: [
        'Creamy or hydrating gel cleanser (CeraVe Hydrating Facial Cleanser)',
        'Hydrating toner or essence with hyaluronic acid',
        'Hydrating serum — snail mucin or peptides',
        'Rich moisturiser with ceramides (CeraVe Moisturising Cream)',
        'Hydrating sunscreen — not matte finish',
      ],
      pm: [
        'Gentle cream cleanser',
        'Hydrating toner or essence',
        'Retinol serum 2–3x per week (with ceramide moisturiser to buffer)',
        'Rich repair cream or sleeping mask',
        'Facial oil on very dry nights (optional)',
      ],
    },
    climateTips: 'Bangladesh\'s winter months (December–January) are mild compared to Europe but can still trigger dry skin, especially with indoor heating and AC. In Dhaka\'s AC-heavy offices and malls, skin loses moisture rapidly. Apply a hydrating toner or mist midday to boost moisture. Look for products with "moisture-binding" ingredients — hyaluronic acid pulls moisture from the air, which is useful in Bangladesh\'s humid environment.',
    commonMistakes: [
      'Using foaming cleansers that strip natural oils',
      'Skipping moisturiser in summer thinking skin doesn\'t need it',
      'Using alcohol-containing toners that dry skin further',
      'Applying too many active serums without adequate moisturiser to buffer',
      'Not drinking enough water — internal hydration matters for dry skin',
    ],
    relatedConcerns: [
      { slug: 'dryness-hydration', label: 'Dryness & Hydration' },
      { slug: 'sensitivity', label: 'Sensitivity' },
      { slug: 'anti-aging-repair', label: 'Anti-Aging & Repair' },
    ],
    relatedIngredients: [
      { slug: 'hyaluronic-acid', label: 'Hyaluronic Acid' },
      { slug: 'ceramide', label: 'Ceramides' },
      { slug: 'snail-mucin', label: 'Snail Mucin' },
      { slug: 'peptide', label: 'Peptides' },
    ],
    faq: [
      { q: 'Why is my skin dry in Bangladesh if the humidity is high?', a: 'Humidity outdoors does not always translate to skin hydration. AC environments, hard water, harsh cleansers, and UV exposure all deplete the skin\'s moisture barrier regardless of outdoor humidity. Dry skin in Bangladesh is most common in winter, in AC offices, and among people who over-cleanse or use strong active ingredients without adequate moisturisation.' },
      { q: 'Which moisturiser is best for dry skin in Bangladesh?', a: 'CeraVe Moisturising Cream is consistently recommended for dry skin — its ceramide and hyaluronic acid formula repairs the skin barrier without fragrance. COSRX Advanced Snail 92 All in One Cream and Skin1004 Madagascar Centella Hyalu-Cica Cream are also well-reviewed for dry skin in Bangladesh\'s climate. All available at Emart with COD.' },
      { q: 'Can I use retinol if I have dry skin?', a: 'Yes, but start low and buffer. Apply a hydrating toner and moisturiser before your retinol (sandwich method) to reduce irritation. CeraVe Skin Renewing Retinol Serum is formulated to be gentle enough for dry skin. Always follow with a rich moisturiser. In Bangladesh\'s cool winter nights, this routine works well.' },
      { q: 'Is hyaluronic acid good for dry skin in Bangladesh?', a: 'Hyaluronic acid is excellent for dry skin and particularly effective in Bangladesh\'s humid environment, as it draws moisture from the air into the skin. Apply it to damp skin after toning and seal with moisturiser. The Ordinary Hyaluronic Acid 2% + B5 and COSRX Hyaluronic Acid Intensive Cream are popular at Emart.' },
      { q: 'How do I care for dry skin during winter in Bangladesh?', a: 'Switch to a richer moisturiser in winter — CeraVe Moisturising Cream (340g) provides intense hydration. Add a hydrating sleeping mask 2–3 nights per week. Use a cream cleanser instead of gel. Reduce active ingredients (AHA/BHA) frequency to once per week. Despite cooler weather, sunscreen is still necessary as UV rays are present year-round in Bangladesh.' },
    ],
  },
  {
    slug: 'combination',
    name: 'Combination Skin',
    nameBn: 'মিশ্র ত্বক',
    tagline: 'Balance your T-zone and cheeks with targeted skincare',
    description: 'Combination skin has different characteristics in different zones — typically an oily T-zone (forehead, nose, chin) with normal to dry cheeks. It is the second most common skin type in Bangladesh after oily skin. Managing combination skin requires balancing hydration in dry zones without feeding excess oil in the T-zone.',
    characteristics: [
      'Shiny T-zone (forehead, nose, chin) with normal or dry cheeks',
      'Enlarged pores visible on nose and forehead',
      'Occasional breakouts in the T-zone; cheeks stay mostly clear',
      'Skin may feel tight after cleansing in cheek areas',
      'Foundation applies unevenly — oily in some areas, flaky in others',
      'Changes with seasons — oilier in monsoon, drier in winter',
    ],
    concerns: ['pores-oil-control', 'dryness-hydration', 'brightening'],
    keyIngredients: ['niacinamide', 'hyaluronic-acid', 'centella', 'bha-salicylic-acid', 'snail-mucin'],
    ingredientsToAvoid: ['heavy occlusive creams on T-zone', 'harsh astringent toners', 'drying spot treatments applied all over'],
    routine: {
      am: [
        'Gentle low-pH gel cleanser (works for both zones)',
        'Hydrating toner — apply lighter on T-zone',
        'Niacinamide serum — balances both zones',
        'Lightweight gel moisturiser on T-zone; slightly richer cream on cheeks if dry',
        'Non-comedogenic SPF50 — one formula for the whole face',
      ],
      pm: [
        'Double cleanse to remove sunscreen and pollution',
        'Hydrating toner',
        'Centella or snail mucin serum for balanced repair',
        'BHA on T-zone 2x per week only',
        'Gel moisturiser all over, heavier cream on dry cheeks only',
      ],
    },
    climateTips: 'In Bangladesh\'s monsoon and summer, combination skin tilts oilier — simplify the routine and use lightweight products everywhere. In winter and AC environments, it tilts drier — add a richer cream on the cheeks. Multi-masking (different masks on different zones) is effective: a clay or BHA mask on the T-zone, and a hydrating mask on the cheeks, 1–2 times per week.',
    commonMistakes: [
      'Using one heavy cream all over — clogs T-zone pores',
      'Using one drying product all over — leaves cheeks parched',
      'Over-exfoliating the T-zone and neglecting cheeks',
      'Skipping moisturiser on the T-zone thinking it\'s already oily enough',
      'Not adjusting routine between seasons in Bangladesh',
    ],
    relatedConcerns: [
      { slug: 'pores-oil-control', label: 'Pores & Oil Control' },
      { slug: 'dryness-hydration', label: 'Dryness & Hydration' },
      { slug: 'brightening', label: 'Brightening' },
    ],
    relatedIngredients: [
      { slug: 'niacinamide', label: 'Niacinamide' },
      { slug: 'hyaluronic-acid', label: 'Hyaluronic Acid' },
      { slug: 'centella', label: 'Centella Asiatica' },
    ],
    faq: [
      { q: 'How do I know if I have combination skin?', a: 'If your T-zone (forehead, nose, chin) is visibly shiny or prone to breakouts but your cheeks feel normal or slightly dry, you likely have combination skin. In Bangladesh\'s summer, the oily zones become more pronounced; in winter, the dry zones become more obvious.' },
      { q: 'Can I use one moisturiser for combination skin?', a: 'Yes — choose a lightweight gel-cream formula that hydrates without clogging pores. COSRX Hyaluronic Acid Intensive Cream and Skin1004 Centella Hyalu-Cica Cream are good all-over options. For very dry cheeks, apply a small amount of richer CeraVe Moisturising Cream on top in those areas only.' },
      { q: 'Which toner is best for combination skin in Bangladesh?', a: 'Look for hydrating, alcohol-free toners that balance without stripping. Anua Heartleaf 77% Soothing Toner and COSRX Hyaluronic Acid Intensive Toner are popular for combination skin. These provide hydration for dry zones without feeding excess oil in the T-zone.' },
      { q: 'Should I use different products on different parts of my face?', a: 'You can, but it\'s not required. Most people with combination skin do well with one balanced routine. However, spot-treating the T-zone with BHA 2–3x per week and applying a richer moisturiser on the cheeks only is a simple and effective strategy.' },
      { q: 'Does combination skin change with Bangladesh\'s seasons?', a: 'Yes, significantly. In Dhaka\'s hot and humid summer and monsoon (April–September), the oily zones produce more sebum. In the cooler, drier winter (November–February), the dry zones feel more parched. Adjust your routine accordingly — lighter products in summer, richer cheek moisturiser in winter.' },
    ],
  },
  {
    slug: 'sensitive',
    name: 'Sensitive Skin',
    nameBn: 'সংবেদনশীল ত্বক',
    tagline: 'Calm, strengthen and protect reactive skin with minimal, gentle ingredients',
    description: 'Sensitive skin reacts easily to skincare products, environmental factors, or lifestyle triggers — showing redness, stinging, itching, or breakouts in response. In Bangladesh, sensitive skin is increasingly common as more people use actives and exfoliants incorrectly, damaging their skin barrier. Hard water, pollution, and fragrance-heavy products are common triggers in Dhaka.',
    characteristics: [
      'Redness, stinging, or burning after applying products',
      'Skin reacts visibly to temperature changes, spicy food, or stress',
      'Breakouts or rashes from fragrance, alcohol, or certain preservatives',
      'Skin barrier feels compromised — tight, reactive, easily flushed',
      'Products that others use fine cause noticeable irritation',
      'May overlap with rosacea, eczema, or atopic dermatitis',
    ],
    concerns: ['sensitivity', 'dryness-hydration', 'acne-blemish-care'],
    keyIngredients: ['centella', 'ceramide', 'hyaluronic-acid', 'snail-mucin', 'mugwort'],
    ingredientsToAvoid: ['fragrance (parfum)', 'essential oils', 'alcohol denat', 'strong acids (high % AHA/BHA)', 'physical exfoliants', 'unverified whitening ingredients'],
    routine: {
      am: [
        'Gentle, fragrance-free cream cleanser or cleansing water',
        'Centella or cica toner — calming and barrier-supporting',
        'Snail mucin or centella serum for repair',
        'Ceramide-rich moisturiser (CeraVe, La Roche-Posay)',
        'Mineral or hybrid SPF — chemical UV filters can irritate sensitive skin',
      ],
      pm: [
        'Gentle micellar water or hydrating cream cleanser',
        'Centella toner',
        'Barrier repair serum — ceramides + peptides',
        'Rich, fragrance-free moisturiser or sleeping mask',
        'Facial oil with minimal ingredients (if very dry or reactive)',
      ],
    },
    climateTips: 'Pollution in Dhaka is a significant trigger for sensitive skin — double cleanse gently each evening to remove particulate matter. Avoid hot showers which strip the barrier. Bangladesh\'s UV is intense year-round; choose a mineral sunscreen with zinc oxide which is gentler on sensitive skin than chemical filters. Some By Mi and Anua have fragrance-free lines suitable for sensitive skin in humid conditions.',
    commonMistakes: [
      'Using too many actives at once — sensitised skin needs a simplified barrier-first approach',
      'Patch-testing nothing — always test new products on the inner arm for 48 hours',
      'Choosing "natural" products assuming they\'re safer — essential oils and botanical extracts are common allergens',
      'Over-exfoliating with AHA/BHA when barrier is already compromised',
      'Ignoring fragrance in products — "parfum" is one of the most common contact allergens',
    ],
    relatedConcerns: [
      { slug: 'sensitivity', label: 'Sensitivity & Redness' },
      { slug: 'dryness-hydration', label: 'Dryness & Hydration' },
      { slug: 'acne-blemish-care', label: 'Acne & Blemish Care' },
    ],
    relatedIngredients: [
      { slug: 'centella', label: 'Centella Asiatica' },
      { slug: 'ceramide', label: 'Ceramides' },
      { slug: 'mugwort', label: 'Mugwort' },
      { slug: 'snail-mucin', label: 'Snail Mucin' },
    ],
    faq: [
      { q: 'How do I know if I have sensitive skin or a damaged barrier?', a: 'True sensitive skin is genetic and reactive even with gentle products. A damaged skin barrier (from over-exfoliation, harsh products, or incorrect use of actives) mimics sensitivity but can be repaired. If your skin suddenly became reactive after starting a new routine, the barrier is likely damaged. Stop active ingredients, focus on ceramide moisturisers and centella products for 4–6 weeks.' },
      { q: 'Which brands are best for sensitive skin in Bangladesh?', a: 'CeraVe, La Roche-Posay, and Avène are the gold standard for sensitive skin — all fragrance-free, clinically tested, and available at Emart. From K-beauty, Some By Mi Miracle Calming Toner and Skin1004 Centella products are popular for sensitive and reactive skin types in Bangladesh.' },
      { q: 'Can sensitive skin use niacinamide?', a: 'Yes — pure niacinamide is generally well-tolerated by sensitive skin. However, some niacinamide products contain fragrance or other actives that can irritate. The Ordinary Niacinamide 10% + Zinc is a minimal formula suitable for sensitive skin. Start with daily use and monitor for any reaction.' },
      { q: 'Is Bangladesh\'s water hard and does it affect sensitive skin?', a: 'Water hardness varies across Bangladesh, but Dhaka\'s municipal water tends to have mineral content that can disrupt the skin barrier with repeated washing. Sensitive skin sufferers may notice more redness or tightness after washing. Use a gentle, low-pH cleanser and always moisturise immediately after to rebuild the barrier.' },
      { q: 'What sunscreen is safe for sensitive skin in Bangladesh?', a: 'Choose mineral or physical sunscreens with zinc oxide and titanium dioxide — chemical UV filters (oxybenzone, avobenzone) can cause stinging or redness on sensitive skin. La Roche-Posay Anthelios Mineral SPF50, CeraVe Hydrating Sunscreen, and Beauty of Joseon Relief Sun (which uses both mineral and chemical filters in gentle proportions) are well-tolerated options.' },
    ],
  },
];

export function getSkinTypeBySlug(slug: string): SkinTypeDefinition | undefined {
  return SKIN_TYPE_DEFINITIONS.find((s) => s.slug === slug);
}
