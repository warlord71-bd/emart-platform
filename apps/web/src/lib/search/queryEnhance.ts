export type SearchEnhancement = {
  original: string;
  normalized: string;
  searchQuery: string;
  expandedQuery: string;
  correctedQuery?: string;
  language: 'bn' | 'en';
};

const TYPO_CORRECTIONS: Array<[RegExp, string]> = [
  [/\bsunscre+a?n\b/gi, 'sunscreen'],
  [/\bsunscren\b/gi, 'sunscreen'],
  [/\bmosturi[sz]er\b/gi, 'moisturizer'],
  [/\bmoistr[iu][sz]er\b/gi, 'moisturizer'],
  [/\bclen[sz]er\b/gi, 'cleanser'],
  [/\bcleanzer\b/gi, 'cleanser'],
  [/\bniacina?mide\b/gi, 'niacinamide'],
  [/\bhylauronic\b/gi, 'hyaluronic'],
  [/\bsalycilic\b/gi, 'salicylic'],
  [/\bretinoll\b/gi, 'retinol'],
  [/\banua\b/gi, 'Anua'],
  [/\bcosrx\b/gi, 'COSRX'],
  [/\bcerave\b/gi, 'CeraVe'],
  [/\bla\s*roche\s*pos[ae]y\b/gi, 'La Roche Posay'],
];

const BANGLA_ALIASES: Array<[RegExp, string]> = [
  [/সান\s*স্ক্রিন|এসপিএফ|spf/gi, 'sunscreen spf sun cream'],
  [/ম[য়য়]েশ্চারাইজার|ময়েশ্চারাইজার|ক্রিম|লোশন/gi, 'moisturizer cream lotion hydrating'],
  [/ফেস\s*ও[য়য়]াশ|ফেসও[য়য়]াশ|ক্লে?নজার|ক্লিনজার/gi, 'cleanser face wash cleansing foam'],
  [/স[েি]রাম|অ্যাম্পুল|এসেন্স/gi, 'serum ampoule essence'],
  [/টোনার|মিস্ট/gi, 'toner mist'],
  [/ব্রণ|পিম্পল|একনে|অ্যাকনে/gi, 'acne blemish pimple'],
  [/ডার্ক\s*স্পট|দাগ|মেছতা|পিগমেন্টেশন/gi, 'dark spot hyperpigmentation brightening'],
  [/তৈলাক্ত|অ[য়য়]েলি|তেলতেলে/gi, 'oily oil control sebum'],
  [/শুষ্ক|ড্রাই|রুক্ষ/gi, 'dry hydrating barrier'],
  [/সেনসিটিভ|সংবেদনশীল/gi, 'sensitive soothing calming'],
  [/গ্লো|উজ্জ্বল|ব্রাইট/gi, 'glow brightening radiance'],
  [/চুল|শ্যাম্পু|হ[েে]য়ার/gi, 'hair shampoo scalp'],
  [/লিপ|ঠোঁট/gi, 'lip balm lip care'],
];

const TRENDING_FALLBACK = [
  'sunscreen',
  'COSRX snail mucin',
  'Anua toner',
  'niacinamide serum',
  'moisturizer',
  'face wash',
  'acne serum',
  'dark spot cream',
];

export function hasBangla(value: string): boolean {
  return /[\u0980-\u09FF]/.test(value);
}

export function normalizeSearchText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function applyTypoCorrections(value: string): string {
  return TYPO_CORRECTIONS.reduce((current, [pattern, replacement]) => (
    current.replace(pattern, replacement)
  ), value);
}

function expandBanglaAliases(value: string): string {
  const aliases = BANGLA_ALIASES
    .filter(([pattern]) => {
      pattern.lastIndex = 0;
      return pattern.test(value);
    })
    .map(([, replacement]) => replacement);

  return aliases.length ? `${value} ${aliases.join(' ')}` : value;
}

export function enhanceSearchQuery(query: string): SearchEnhancement {
  const original = normalizeSearchText(query);
  const corrected = normalizeSearchText(applyTypoCorrections(original));
  const language = hasBangla(original) ? 'bn' : 'en';
  const expanded = normalizeSearchText(expandBanglaAliases(corrected));

  return {
    original,
    normalized: original.toLowerCase(),
    searchQuery: corrected,
    expandedQuery: expanded,
    correctedQuery: corrected !== original ? corrected : undefined,
    language,
  };
}

export function getTrendingSearchTerms(limit = 8): string[] {
  return TRENDING_FALLBACK.slice(0, limit);
}
