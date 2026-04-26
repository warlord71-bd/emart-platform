import type { WooProduct } from '@/lib/woocommerce';

export type SkinType = 'oily' | 'combination' | 'dry' | 'sensitive' | 'normal';
export type SkinConcern =
  | 'acne-blemish-care'
  | 'pores-oil-control'
  | 'dryness-hydration'
  | 'melasma'
  | 'brightening'
  | 'sensitivity'
  | 'anti-aging-repair';
export type SkinEnvironment = 'dhaka-heat' | 'ac-office' | 'mixed-city' | 'mostly-indoors';
export type RoutinePace = 'quick' | 'balanced' | 'focused';
export type BudgetBand = 'starter' | 'steady' | 'flexible';

export interface SkinQuizProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  purchasable: boolean;
  stock_status: WooProduct['stock_status'];
  featured: boolean;
  average_rating: string;
  rating_count: number;
  short_description: string;
  images: Array<{
    src: string;
    alt: string;
    name: string;
  }>;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
}

export interface SkinQuizAnswers {
  skinType: SkinType;
  concerns: SkinConcern[];
  environment: SkinEnvironment;
  routinePace: RoutinePace;
  budget: BudgetBand;
}

export interface SkinQuizProductPools {
  cleansers: SkinQuizProduct[];
  toners: SkinQuizProduct[];
  serums: SkinQuizProduct[];
  moisturizers: SkinQuizProduct[];
  sunscreens: SkinQuizProduct[];
  masks: SkinQuizProduct[];
  concerns: Record<SkinConcern, SkinQuizProduct[]>;
}

export interface SkinQuizOption<T extends string> {
  value: T;
  label: string;
  note: string;
  icon: string;
}

export interface SkinQuizRoutineStep {
  key: string;
  label: string;
  cadence: 'AM' | 'PM' | '2x/week';
  why: string;
  href: string;
  product: SkinQuizProduct | null;
}

export interface SkinQuizResult {
  headline: string;
  summary: string;
  profile: {
    skinType: string;
    concerns: string[];
    environment: string;
    routinePace: string;
    budget: string;
  };
  morning: SkinQuizRoutineStep[];
  night: SkinQuizRoutineStep[];
  weekly: SkinQuizRoutineStep[];
  notes: string[];
  routineMatchNote: string;
  shopHref: string;
  recommendedProducts: SkinQuizProduct[];
}

export interface SkinQuizEmailPayload {
  name: string;
  email: string;
  subscribe: boolean;
  answers: SkinQuizAnswers;
  result: SkinQuizResult;
}

export const SKIN_TYPE_OPTIONS: SkinQuizOption<SkinType>[] = [
  { value: 'oily', label: 'Oily', note: 'Shine builds quickly and pores feel visible.', icon: '💧' },
  { value: 'combination', label: 'Combination', note: 'T-zone gets oily but cheeks feel calmer.', icon: '⚖️' },
  { value: 'dry', label: 'Dry', note: 'Tightness, flakes, or rough patches show up fast.', icon: '🌵' },
  { value: 'sensitive', label: 'Sensitive', note: 'Redness or stinging happens easily.', icon: '🌿' },
  { value: 'normal', label: 'Balanced', note: 'Mostly steady, with only occasional shifts.', icon: '☁️' },
];

export const CONCERN_OPTIONS: SkinQuizOption<SkinConcern>[] = [
  { value: 'acne-blemish-care', label: 'Breakouts', note: 'Active acne, bumps, or post-acne recovery.', icon: '🎯' },
  { value: 'pores-oil-control', label: 'Oil & Pores', note: 'Shine, blackheads, or clogged texture.', icon: '🫧' },
  { value: 'dryness-hydration', label: 'Dehydration', note: 'Skin feels thirsty, tight, or dull.', icon: '💦' },
  { value: 'melasma', label: 'Dark Spots', note: 'Sun marks, acne marks, or uneven patches.', icon: '☀️' },
  { value: 'brightening', label: 'Dullness', note: 'Skin looks tired and needs glow support.', icon: '✨' },
  { value: 'sensitivity', label: 'Redness', note: 'Barrier stress, reactivity, or stinging.', icon: '🛡️' },
  { value: 'anti-aging-repair', label: 'Lines & Repair', note: 'Fine lines, bounce loss, or repair focus.', icon: '⏳' },
];

export const ENVIRONMENT_OPTIONS: SkinQuizOption<SkinEnvironment>[] = [
  { value: 'dhaka-heat', label: 'Dhaka Heat + Commute', note: 'Humidity, sun, sweat, and dust most days.', icon: '🌤️' },
  { value: 'ac-office', label: 'AC Office / Campus', note: 'Long indoor hours that leave skin tight.', icon: '❄️' },
  { value: 'mixed-city', label: 'Mixed City Days', note: 'Commute plus indoor AC in the same day.', icon: '🏙️' },
  { value: 'mostly-indoors', label: 'Mostly Indoors', note: 'Low sun exposure but screen and AC time.', icon: '🏠' },
];

export const ROUTINE_PACE_OPTIONS: SkinQuizOption<RoutinePace>[] = [
  { value: 'quick', label: '3-step Easy', note: 'Low-maintenance routine that still covers the basics.', icon: '⚡' },
  { value: 'balanced', label: '4-step Daily', note: 'Comfortable routine with one treatment layer.', icon: '🧴' },
  { value: 'focused', label: 'Treatment-first', note: 'You are okay with a more targeted routine.', icon: '🔬' },
];

export const BUDGET_OPTIONS: SkinQuizOption<BudgetBand>[] = [
  { value: 'starter', label: 'Smart Start', note: 'Keep the routine lean and price-conscious.', icon: '💸' },
  { value: 'steady', label: 'Best Value', note: 'Balance performance and everyday spend.', icon: '🛍️' },
  { value: 'flexible', label: 'Best Match First', note: 'Fit matters more than a tight cap.', icon: '💎' },
];

const skinTypeLabels: Record<SkinType, string> = {
  oily: 'Oily',
  combination: 'Combination',
  dry: 'Dry',
  sensitive: 'Sensitive',
  normal: 'Balanced',
};

const concernLabels: Record<SkinConcern, string> = {
  'acne-blemish-care': 'Breakouts',
  'pores-oil-control': 'Oil & Pores',
  'dryness-hydration': 'Dehydration',
  melasma: 'Dark Spots',
  brightening: 'Dullness',
  sensitivity: 'Redness',
  'anti-aging-repair': 'Lines & Repair',
};

const environmentLabels: Record<SkinEnvironment, string> = {
  'dhaka-heat': 'Dhaka heat, sun, commute, and humidity',
  'ac-office': 'Long AC office or campus days',
  'mixed-city': 'Mixed city commute and indoor AC',
  'mostly-indoors': 'Mostly indoor days',
};

const routinePaceLabels: Record<RoutinePace, string> = {
  quick: '3-step easy',
  balanced: '4-step daily',
  focused: 'Treatment-first',
};

const budgetLabels: Record<BudgetBand, string> = {
  starter: 'Smart Start',
  steady: 'Best Value',
  flexible: 'Best Match First',
};

function stripHtml(value?: string) {
  return (value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function productText(product: SkinQuizProduct) {
  return [
    product.name,
    stripHtml(product.short_description),
    product.categories.map((category) => category.name).join(' '),
  ].join(' ').toLowerCase();
}

function parsePrice(value?: string) {
  const numeric = Number.parseFloat(String(value || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

function productUrl(product: SkinQuizProduct) {
  return `https://e-mart.com.bd/shop/${product.slug}`;
}

function concernHref(concern: SkinConcern) {
  return `/concerns?concern=${encodeURIComponent(concern)}`;
}

function dedupeProducts(products: SkinQuizProduct[]) {
  const seen = new Set<number>();
  return products.filter((product) => {
    if (!product?.id || seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });
}

function defaultConcernForSkinType(skinType: SkinType): SkinConcern {
  if (skinType === 'dry') return 'dryness-hydration';
  if (skinType === 'sensitive') return 'sensitivity';
  if (skinType === 'oily' || skinType === 'combination') return 'pores-oil-control';
  return 'brightening';
}

function budgetCap(budget: BudgetBand) {
  if (budget === 'starter') return 1400;
  if (budget === 'steady') return 2400;
  return 4000;
}

function keywordScore(text: string, keywords: string[]) {
  return keywords.reduce((score, keyword) => {
    return score + (text.includes(keyword) ? 5 : 0);
  }, 0);
}

function scoreBudget(price: number, budget: BudgetBand) {
  if (!price) return 0;
  const cap = budgetCap(budget);
  if (price <= cap) return 6;
  if (price <= cap * 1.25) return 2;
  if (budget === 'flexible') return 1;
  return -4;
}

function scorePopularity(product: SkinQuizProduct) {
  const rating = Number.parseFloat(product.average_rating || '0');
  return Math.min(6, Math.round(rating)) + Math.min(6, Math.floor((product.rating_count || 0) / 80));
}

function concernKeywords(concern: SkinConcern, pace: RoutinePace) {
  if (concern === 'acne-blemish-care') return ['acne', 'spot', 'bha', 'salicylic', 'niacinamide', 'tea tree', 'cica'];
  if (concern === 'pores-oil-control') return ['pore', 'sebum', 'oil', 'niacinamide', 'bha', 'clay', 'blackhead'];
  if (concern === 'dryness-hydration') return ['hydr', 'hyaluronic', 'ceramide', 'barrier', 'panthenol', 'beta'];
  if (concern === 'melasma') return ['dark spot', 'alpha arbutin', 'tranexamic', 'vitamin c', 'niacinamide', 'bright'];
  if (concern === 'brightening') return ['glow', 'bright', 'niacinamide', 'vitamin c', 'rice', 'propolis'];
  if (concern === 'sensitivity') return ['centella', 'cica', 'soothing', 'calming', 'panthenol', 'barrier', 'heartleaf'];
  if (pace === 'focused') return ['retinal', 'retinol', 'peptide', 'repair', 'ginseng', 'firm'];
  return ['peptide', 'repair', 'ginseng', 'firm', 'collagen'];
}

function stepBaseKeywords(answers: SkinQuizAnswers) {
  const primaryConcern = answers.concerns[0] || defaultConcernForSkinType(answers.skinType);
  const concernTerms = concernKeywords(primaryConcern, answers.routinePace);

  return {
    cleanser: [
      'cleanser',
      ...(answers.skinType === 'oily' || answers.skinType === 'combination' || answers.environment === 'dhaka-heat'
        ? ['gel', 'foam', 'low ph', 'fresh']
        : []),
      ...(answers.skinType === 'dry' || answers.environment === 'ac-office'
        ? ['hydr', 'cream', 'moisture', 'gentle']
        : []),
      ...(answers.skinType === 'sensitive' ? ['gentle', 'cica', 'centella', 'soothing'] : []),
      ...(primaryConcern === 'acne-blemish-care' || primaryConcern === 'pores-oil-control'
        ? ['pore', 'salicylic', 'tea tree']
        : []),
    ],
    prep: [
      'toner',
      'essence',
      ...(answers.environment === 'ac-office' || answers.skinType === 'dry' || answers.skinType === 'sensitive'
        ? ['hydr', 'soothing', 'barrier', 'centella', 'panthenol', 'rice']
        : []),
      ...(primaryConcern === 'brightening' || primaryConcern === 'melasma' ? ['glow', 'bright', 'niacinamide', 'rice'] : []),
      ...(primaryConcern === 'pores-oil-control' ? ['balancing', 'clarifying', 'pore'] : []),
    ],
    treat: concernTerms,
    moisturizer: [
      ...(answers.skinType === 'oily' || answers.environment === 'dhaka-heat'
        ? ['gel', 'water', 'light', 'soothing', 'cica']
        : []),
      ...(answers.skinType === 'dry' || answers.environment === 'ac-office'
        ? ['cream', 'barrier', 'ceramide', 'moisture', 'repair']
        : []),
      ...(answers.skinType === 'sensitive' ? ['centella', 'barrier', 'panthenol', 'calming'] : []),
      ...(answers.skinType === 'normal' ? ['cream', 'hydr', 'barrier'] : []),
    ],
    sunscreen: [
      'sun',
      'spf',
      ...(answers.skinType === 'oily' || answers.environment === 'dhaka-heat' ? ['fluid', 'gel', 'matte', 'light'] : []),
      ...(answers.skinType === 'dry' || answers.environment === 'ac-office' ? ['moist', 'cream', 'essence', 'hydr'] : []),
      ...(answers.skinType === 'sensitive' ? ['mild', 'soothing', 'calming'] : []),
    ],
    weekly: [
      ...(primaryConcern === 'dryness-hydration' || answers.skinType === 'dry' ? ['mask', 'hydr', 'sleeping', 'barrier'] : []),
      ...(primaryConcern === 'sensitivity' ? ['soothing', 'calming', 'centella', 'cica', 'mask'] : []),
      ...(primaryConcern === 'melasma' || primaryConcern === 'brightening' ? ['glow', 'bright', 'mask', 'rice', 'vitamin c'] : []),
      ...(primaryConcern === 'acne-blemish-care' || primaryConcern === 'pores-oil-control'
        ? ['clay', 'mask', 'bha', 'pore', 'clearing']
        : []),
      ...(primaryConcern === 'anti-aging-repair' ? ['repair', 'sleeping', 'peptide', 'mask'] : []),
    ],
  };
}

function pickProduct(
  candidates: SkinQuizProduct[],
  {
    answers,
    includeKeywords,
    avoidKeywords = [],
    usedIds,
  }: {
    answers: SkinQuizAnswers;
    includeKeywords: string[];
    avoidKeywords?: string[];
    usedIds: Set<number>;
  }
) {
  const scored = dedupeProducts(candidates)
    .filter((product) => product.purchasable !== false && product.stock_status !== 'outofstock' && !usedIds.has(product.id))
    .map((product) => {
      const text = productText(product);
      const price = parsePrice(product.sale_price || product.price || product.regular_price);
      let score = 0;
      score += keywordScore(text, includeKeywords);
      score -= keywordScore(text, avoidKeywords);
      score += scoreBudget(price, answers.budget);
      score += scorePopularity(product);
      if (product.featured) score += 2;
      if (product.on_sale) score += 1;
      return { product, score };
    })
    .sort((left, right) => right.score - left.score);

  return scored[0]?.product || null;
}

function routineNotes(answers: SkinQuizAnswers, primaryConcern: SkinConcern) {
  const notes = [
    answers.environment === 'dhaka-heat'
      ? 'Keep daytime layers lighter than your night routine. Bangladesh humidity usually rewards thin hydration plus reliable SPF.'
      : answers.environment === 'ac-office'
        ? 'AC-heavy days can dehydrate skin even when it still looks shiny. Do not skip barrier support at night.'
        : 'Use lighter textures in the day and save richer support for night if your skin starts feeling heavy.',
    primaryConcern === 'melasma' || primaryConcern === 'brightening'
      ? 'Dark spots respond best when sunscreen is consistent. In Bangladesh sun, missing SPF undoes more progress than almost any serum can recover.'
      : primaryConcern === 'acne-blemish-care' || primaryConcern === 'pores-oil-control'
        ? 'If congestion rises, change only one product at a time so you can see what your skin actually likes.'
        : 'Start any new active slowly. A calmer barrier usually gives better long-term results than stacking too many products on day one.',
    answers.routinePace === 'focused' && primaryConcern === 'anti-aging-repair'
      ? 'If you add retinal or retinol, begin with two nights a week and keep the rest of the routine gentle.'
      : 'Patch test first, especially if your skin is reactive or you are rebuilding after irritation.',
  ];

  return notes;
}

function matchNote(answers: SkinQuizAnswers) {
  if (answers.environment === 'dhaka-heat') {
    return 'Built to stay comfortable through humidity, sweat, and daily Dhaka sun exposure.';
  }
  if (answers.environment === 'ac-office') {
    return 'Built to stop the oily-but-dehydrated feeling that shows up after long AC hours.';
  }
  if (answers.environment === 'mixed-city') {
    return 'Built for a routine that survives both commute heat and indoor AC without feeling heavy.';
  }
  return 'Built for easy consistency, low-friction layers, and daily sunscreen even on indoor-heavy days.';
}

export function buildSkinQuizResult(answers: SkinQuizAnswers, pools: SkinQuizProductPools): SkinQuizResult {
  const primaryConcern = answers.concerns[0] || defaultConcernForSkinType(answers.skinType);
  const baseKeywords = stepBaseKeywords(answers);
  const usedIds = new Set<number>();

  const concernPool = pools.concerns[primaryConcern] || [];
  const supportConcernPools = answers.concerns.slice(1).flatMap((concern) => pools.concerns[concern] || []);

  const cleanser = pickProduct(pools.cleansers, {
    answers,
    includeKeywords: baseKeywords.cleanser,
    avoidKeywords: answers.skinType === 'sensitive' ? ['scrub', 'peel'] : [],
    usedIds,
  });
  if (cleanser) usedIds.add(cleanser.id);

  const prep = answers.routinePace === 'quick'
    ? null
    : pickProduct([...concernPool, ...pools.toners], {
      answers,
      includeKeywords: baseKeywords.prep,
      avoidKeywords: answers.skinType === 'sensitive' ? ['aha', 'bha', 'scrub'] : [],
      usedIds,
    });
  if (prep) usedIds.add(prep.id);

  const treat = pickProduct([...concernPool, ...supportConcernPools, ...pools.serums], {
    answers,
    includeKeywords: baseKeywords.treat,
    avoidKeywords: answers.skinType === 'sensitive' || answers.concerns.includes('dryness-hydration')
      ? ['strong', 'peel']
      : [],
    usedIds,
  });
  if (treat) usedIds.add(treat.id);

  const moisturizer = pickProduct([...concernPool, ...pools.moisturizers], {
    answers,
    includeKeywords: baseKeywords.moisturizer,
    avoidKeywords: answers.environment === 'dhaka-heat' && answers.skinType !== 'dry' ? ['heavy balm'] : [],
    usedIds,
  });
  if (moisturizer) usedIds.add(moisturizer.id);

  const sunscreen = pickProduct([...pools.concerns.melasma, ...pools.concerns.brightening, ...pools.sunscreens], {
    answers,
    includeKeywords: baseKeywords.sunscreen,
    usedIds,
  });
  if (sunscreen) usedIds.add(sunscreen.id);

  const weekly = pickProduct([...concernPool, ...pools.masks, ...pools.toners], {
    answers,
    includeKeywords: baseKeywords.weekly,
    usedIds,
  });
  if (weekly) usedIds.add(weekly.id);

  const nightTreat = answers.routinePace === 'quick'
    ? treat
    : pickProduct([...concernPool, ...supportConcernPools, ...pools.serums, ...pools.toners], {
      answers,
      includeKeywords: [
        ...baseKeywords.treat,
        ...(answers.routinePace === 'focused' ? ['repair', 'serum', 'night', 'ampoule'] : ['soothing', 'repair']),
      ],
      avoidKeywords: answers.skinType === 'sensitive' ? ['scrub'] : [],
      usedIds,
    }) || treat;
  if (nightTreat && !usedIds.has(nightTreat.id)) usedIds.add(nightTreat.id);

  const morning: SkinQuizRoutineStep[] = [
    {
      key: 'cleanse',
      label: answers.skinType === 'dry' ? 'Gentle cleanse or rinse' : 'Cleanse',
      cadence: 'AM',
      why: 'Clear away overnight oil, sweat, and city dust without stripping your barrier.',
      href: '/category/face-cleansers',
      product: cleanser,
    },
    ...(prep ? [{
      key: 'prep',
      label: 'Prep with toner / essence',
      cadence: 'AM' as const,
      why: answers.environment === 'ac-office'
        ? 'This adds water back before AC pulls it out again.'
        : 'A light prep layer helps the next treatment sit better without feeling thick.',
      href: '/category/toners-mists',
      product: prep,
    }] : []),
    {
      key: 'treat',
      label: 'Targeted serum',
      cadence: 'AM',
      why: `This is the step doing the main work for ${concernLabels[primaryConcern].toLowerCase()}.`,
      href: concernHref(primaryConcern),
      product: treat,
    },
    {
      key: 'moisturize',
      label: 'Moisturize',
      cadence: 'AM',
      why: answers.skinType === 'oily' || answers.environment === 'dhaka-heat'
        ? 'Use a lighter layer so your skin stays comfortable through the day.'
        : 'Seal in hydration so your skin does not feel tight by midday.',
      href: '/category/night-cream',
      product: moisturizer,
    },
    {
      key: 'protect',
      label: 'Daily sunscreen',
      cadence: 'AM',
      why: 'This is the non-negotiable step for Bangladesh sun, tan, post-acne marks, and barrier protection.',
      href: '/category/sunscreen',
      product: sunscreen,
    },
  ];

  const night: SkinQuizRoutineStep[] = [
    {
      key: 'night-cleanse',
      label: 'Cleanse properly',
      cadence: 'PM',
      why: 'At night, remove sunscreen, pollution, and the day’s buildup before anything else.',
      href: '/category/face-cleansers',
      product: cleanser,
    },
    ...(answers.routinePace !== 'quick' && prep ? [{
      key: 'night-prep',
      label: 'Rehydrate / calm',
      cadence: 'PM' as const,
      why: 'A calm skin barrier makes every active work better and sting less.',
      href: '/category/toners-mists',
      product: prep,
    }] : []),
    {
      key: 'night-treat',
      label: answers.routinePace === 'focused' ? 'Treatment layer' : 'Recovery serum',
      cadence: 'PM',
      why: answers.routinePace === 'focused'
        ? 'Night is the safest place to do the heavier lifting for texture, repair, or mark care.'
        : 'Keep the main treatment consistent at night so you do not overload the routine.',
      href: concernHref(primaryConcern),
      product: nightTreat,
    },
    {
      key: 'night-moisturize',
      label: 'Barrier moisturizer',
      cadence: 'PM',
      why: 'Lock in comfort overnight so skin feels less reactive the next morning.',
      href: '/category/night-cream',
      product: moisturizer,
    },
  ];

  const weeklySteps: SkinQuizRoutineStep[] = weekly ? [
    {
      key: 'weekly',
      label: answers.routinePace === 'focused' ? 'Weekly booster' : 'Optional weekly reset',
      cadence: '2x/week',
      why: primaryConcern === 'dryness-hydration' || primaryConcern === 'sensitivity'
        ? 'Use this when your barrier feels tired, tight, or stressed.'
        : 'Use this one or two nights a week instead of adding more products every day.',
      href: '/category/face-masks',
      product: weekly,
    },
  ] : [];

  const recommendedProducts = dedupeProducts([
    ...morning.map((step) => step.product).filter(Boolean) as SkinQuizProduct[],
    ...night.map((step) => step.product).filter(Boolean) as SkinQuizProduct[],
    ...weeklySteps.map((step) => step.product).filter(Boolean) as SkinQuizProduct[],
  ]);

  return {
    headline: `${skinTypeLabels[answers.skinType]} routine for ${environmentLabels[answers.environment].replace('Dhaka ', 'Dhaka ').toLowerCase()}`,
    summary: `Built around ${concernLabels[primaryConcern].toLowerCase()}, ${routinePaceLabels[answers.routinePace].toLowerCase()} pacing, and a ${budgetLabels[answers.budget].toLowerCase()} spend level.`,
    profile: {
      skinType: skinTypeLabels[answers.skinType],
      concerns: (answers.concerns.length > 0 ? answers.concerns : [primaryConcern]).map((concern) => concernLabels[concern]),
      environment: environmentLabels[answers.environment],
      routinePace: routinePaceLabels[answers.routinePace],
      budget: budgetLabels[answers.budget],
    },
    morning,
    night,
    weekly: weeklySteps,
    notes: routineNotes(answers, primaryConcern),
    routineMatchNote: matchNote(answers),
    shopHref: primaryConcern ? concernHref(primaryConcern) : '/shop?sort=popularity',
    recommendedProducts,
  };
}

