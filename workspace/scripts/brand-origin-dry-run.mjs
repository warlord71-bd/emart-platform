#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const WP_PATH = process.env.WP_PATH || '/var/www/wordpress';
const OUT_DIR = process.env.OUT_DIR || `/root/emart-platform/workspace/audit/seo/brand-origin-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}`;

const ORIGIN_BY_BRAND_SLUG = {
  // Korea
  '3w-clinic': ['korea', 'safe', 'known_k_beauty_brand'],
  'abib': ['korea', 'safe', 'known_k_beauty_brand'],
  'acwell': ['korea', 'safe', 'known_k_beauty_brand'],
  'aestura': ['korea', 'safe', 'known_k_beauty_brand'],
  'ahc': ['korea', 'safe', 'known_k_beauty_brand'],
  'ampoule': ['korea', 'review', 'possible_brand_slug_noise'],
  'ample-n': ['korea', 'safe', 'known_k_beauty_brand'],
  'anjo': ['korea', 'safe', 'known_k_beauty_brand'],
  'anua': ['korea', 'safe', 'known_k_beauty_brand'],
  'aplb': ['korea', 'safe', 'known_k_beauty_brand'],
  'apieu': ['korea', 'safe', 'known_k_beauty_brand'],
  'aprilskin': ['korea', 'safe', 'known_k_beauty_brand'],
  'arencia': ['korea', 'safe', 'known_k_beauty_brand'],
  'aromatica': ['korea', 'safe', 'known_k_beauty_brand'],
  'axis-y': ['korea', 'safe', 'known_k_beauty_brand'],
  'b-lab': ['korea', 'safe', 'known_k_beauty_brand'],
  'bad-skin': ['korea', 'safe', 'known_k_beauty_brand'],
  'banila-co': ['korea', 'safe', 'known_k_beauty_brand'],
  'barulab': ['korea', 'safe', 'known_k_beauty_brand'],
  'beauty-of-joseon': ['korea', 'safe', 'official_korean_skincare_brand'],
  'be-the-skin': ['korea', 'safe', 'known_k_beauty_brand'],
  'belif': ['korea', 'safe', 'known_k_beauty_brand'],
  'bellflower': ['korea', 'safe', 'known_k_beauty_brand'],
  'benton': ['korea', 'safe', 'known_k_beauty_brand'],
  'biodance': ['korea', 'safe', 'known_k_beauty_brand'],
  'bonajour': ['korea', 'safe', 'known_k_beauty_brand'],
  'bring-green': ['korea', 'safe', 'known_k_beauty_brand'],
  'by-wishtrend': ['korea', 'safe', 'known_k_beauty_brand'],
  'carenel': ['korea', 'safe', 'known_k_beauty_brand'],
  'celimax': ['korea', 'safe', 'known_k_beauty_brand'],
  'charmzone': ['korea', 'safe', 'known_k_beauty_brand'],
  'cnp-laboratory': ['korea', 'safe', 'known_k_beauty_brand'],
  'clairs-korea': ['korea', 'safe', 'known_k_beauty_brand'],
  'cos-de-baha': ['korea', 'safe', 'official_company_location_korea'],
  'cosrx': ['korea', 'safe', 'official_cosrx_k_beauty_brand'],
  'coxir': ['korea', 'safe', 'known_k_beauty_brand'],
  'dabo': ['korea', 'safe', 'known_k_beauty_brand'],
  'daily-comma': ['korea', 'safe', 'known_k_beauty_brand'],
  'dear-klairs': ['korea', 'safe', 'known_k_beauty_brand'],
  'derma-factory': ['korea', 'safe', 'known_k_beauty_brand'],
  'dr-althea': ['korea', 'safe', 'known_k_beauty_brand'],
  'dr-ceuracle': ['korea', 'safe', 'known_k_beauty_brand'],
  'dr-forhair': ['korea', 'safe', 'known_k_beauty_brand'],
  'dr-g': ['korea', 'safe', 'known_k_beauty_brand'],
  'dr-gilla': ['korea', 'review', 'verify_brand_origin'],
  'dr-jart': ['korea', 'safe', 'known_k_beauty_brand'],
  'dongsung': ['korea', 'safe', 'known_k_beauty_brand'],
  'ekel': ['korea', 'safe', 'known_k_beauty_brand'],
  'elastine': ['korea', 'safe', 'known_k_beauty_brand'],
  'enguun': ['korea', 'review', 'verify_brand_origin'],
  'enprani': ['korea', 'safe', 'known_k_beauty_brand'],
  'eqqualberry': ['korea', 'safe', 'known_k_beauty_brand'],
  'etude': ['korea', 'safe', 'known_k_beauty_brand'],
  'etude-house': ['korea', 'safe', 'known_k_beauty_brand'],
  'farmstay': ['korea', 'safe', 'known_k_beauty_brand'],
  'foodaholic': ['korea', 'safe', 'known_k_beauty_brand'],
  'frankly': ['korea', 'safe', 'known_k_beauty_brand'],
  'freemo': ['korea', 'review', 'verify_brand_origin'],
  'freemo-factory': ['korea', 'review', 'verify_brand_origin'],
  'freeman': ['usa', 'safe', 'known_usa_brand'],
  'frudia': ['korea', 'safe', 'known_k_beauty_brand'],
  'fruida': ['korea', 'safe', 'likely_frudia_slug_variant'],
  'fully': ['korea', 'safe', 'known_k_beauty_brand'],
  'g9-skin': ['korea', 'safe', 'known_k_beauty_brand'],
  'gamdong': ['korea', 'review', 'verify_brand_origin'],
  'goodal': ['korea', 'safe', 'known_k_beauty_brand'],
  'green-finger': ['korea', 'safe', 'known_k_beauty_brand'],
  'happy-bath': ['korea', 'safe', 'known_k_beauty_brand'],
  'haruharu': ['korea', 'safe', 'known_k_beauty_brand'],
  'haruharu-wonder': ['korea', 'safe', 'known_k_beauty_brand'],
  'healthy-place': ['korea', 'review', 'user_requested_confirm_healthy_place'],
  'heimish': ['korea', 'safe', 'known_k_beauty_brand'],
  'hera': ['korea', 'safe', 'known_k_beauty_brand'],
  'heeyul': ['korea', 'safe', 'known_k_beauty_brand'],
  'holika-holika': ['korea', 'safe', 'known_k_beauty_brand'],
  'house-of-hur': ['korea', 'safe', 'known_k_beauty_brand'],
  'htS': ['korea', 'review', 'verify_brand_origin'],
  'illiyoon': ['korea', 'safe', 'known_k_beauty_brand'],
  'ilso': ['korea', 'safe', 'known_k_beauty_brand'],
  'i-am-from': ['korea', 'safe', 'known_k_beauty_brand'],
  'innisfree': ['korea', 'safe', 'known_k_beauty_brand'],
  'isntree': ['korea', 'safe', 'known_k_beauty_brand'],
  'iunik': ['korea', 'safe', 'known_k_beauty_brand'],
  'izeze': ['korea', 'safe', 'known_k_beauty_brand'],
  'jigott': ['korea', 'safe', 'known_k_beauty_brand'],
  'jumiso': ['korea', 'safe', 'known_k_beauty_brand'],
  'julyme': ['korea', 'safe', 'known_k_beauty_brand'],
  'kaine': ['korea', 'safe', 'known_k_beauty_brand'],
  'kanghwa': ['korea', 'review', 'verify_brand_origin'],
  'kerasys': ['korea', 'safe', 'known_k_beauty_brand'],
  'ksecret': ['korea', 'safe', 'known_k_beauty_brand'],
  'koelcia': ['korea', 'safe', 'known_k_beauty_brand'],
  'kolon': ['korea', 'safe', 'known_korean_company'],
  'kolon-pharmaceutical': ['korea', 'safe', 'known_korean_company'],
  'korea-red-ginseng': ['korea', 'safe', 'known_korean_origin'],
  'korean-ginseng': ['korea', 'safe', 'known_korean_origin'],
  'korean-home-acc': ['korea', 'review', 'category_like_brand'],
  'kosem': ['korea', 'review', 'verify_brand_origin'],
  'kosmedica': ['korea', 'review', 'verify_brand_origin'],
  'laneige': ['korea', 'safe', 'known_k_beauty_brand'],
  'lebelage': ['korea', 'safe', 'known_k_beauty_brand'],
  'lebel-young': ['korea', 'safe', 'known_k_beauty_brand'],
  'mamonde': ['korea', 'safe', 'known_k_beauty_brand'],
  'manyo': ['korea', 'safe', 'known_k_beauty_brand'],
  'mary-and-may': ['korea', 'safe', 'known_k_beauty_brand'],
  'medb': ['korea', 'review', 'verify_brand_origin'],
  'medicube': ['korea', 'safe', 'known_k_beauty_brand'],
  'mediflower': ['korea', 'safe', 'known_k_beauty_brand'],
  'medi-peel': ['korea', 'safe', 'known_k_beauty_brand'],
  'mise-en-scene': ['korea', 'safe', 'known_k_beauty_brand'],
  'missha': ['korea', 'safe', 'known_k_beauty_brand'],
  'mixsoon': ['korea', 'safe', 'known_k_beauty_brand'],
  'nacific': ['korea', 'safe', 'known_k_beauty_brand'],
  'nature-republic': ['korea', 'safe', 'known_k_beauty_brand'],
  'needly': ['korea', 'safe', 'known_k_beauty_brand'],
  'nella': ['korea', 'safe', 'known_k_beauty_brand'],
  'neogen': ['korea', 'safe', 'known_k_beauty_brand'],
  'nineless': ['korea', 'safe', 'known_k_beauty_brand'],
  'numbuzin': ['korea', 'safe', 'known_k_beauty_brand'],
  'ongredients': ['korea', 'safe', 'known_k_beauty_brand'],
  'on-the-body': ['korea', 'safe', 'known_korean_lg_brand'],
  'p-calm': ['korea', 'safe', 'known_k_beauty_brand'],
  'paxmoly': ['korea', 'safe', 'known_k_beauty_brand'],
  'phytotree': ['korea', 'review', 'web_verify_needed'],
  'pinkflash': ['china', 'safe', 'known_chinese_brand'],
  'plu': ['korea', 'safe', 'known_k_beauty_brand'],
  'plu365': ['korea', 'safe', 'known_k_beauty_brand'],
  'pororo': ['korea', 'safe', 'known_korean_brand'],
  'purito': ['korea', 'safe', 'known_k_beauty_brand'],
  'purito-seoul': ['korea', 'safe', 'known_k_beauty_brand'],
  'pyunkang-yul': ['korea', 'safe', 'known_k_beauty_brand'],
  'raip': ['korea', 'safe', 'known_k_beauty_brand'],
  'rated-green': ['korea', 'safe', 'known_k_beauty_brand'],
  'ribana': ['bangladesh', 'safe', 'known_bd_brand'],
  'romnd': ['korea', 'safe', 'known_k_beauty_brand'],
  'rom-and-nd': ['korea', 'safe', 'known_k_beauty_brand'],
  'roothair': ['korea', 'review', 'verify_brand_origin'],
  'round-lab': ['korea', 'safe', 'known_k_beauty_brand'],
  'rovectin': ['korea', 'safe', 'known_k_beauty_brand'],
  'ryo': ['korea', 'safe', 'known_k_beauty_brand'],
  'secret-day': ['korea', 'safe', 'known_korean_brand'],
  'secret-key': ['korea', 'safe', 'known_k_beauty_brand'],
  'seoul-1988': ['korea', 'safe', 'brand_name_origin_signal'],
  'shiliya': ['korea', 'review', 'verify_brand_origin'],
  'simplyo': ['korea', 'safe', 'known_k_beauty_brand'],
  'skincafe': ['bangladesh', 'safe', 'known_bd_brand'],
  'skinmiso': ['korea', 'safe', 'known_k_beauty_brand'],
  'skino': ['korea', 'safe', 'known_k_beauty_brand'],
  'skin1004': ['korea', 'safe', 'known_k_beauty_brand'],
  'skinfood': ['korea', 'safe', 'known_k_beauty_brand'],
  'some-by-mi': ['korea', 'safe', 'known_k_beauty_brand'],
  'son-and-park': ['korea', 'safe', 'known_k_beauty_brand'],
  'sulwhasoo': ['korea', 'safe', 'known_k_beauty_brand'],
  'sungboon': ['korea', 'safe', 'known_k_beauty_brand'],
  'the-face-shop': ['korea', 'safe', 'known_k_beauty_brand'],
  'the-saem': ['korea', 'safe', 'known_k_beauty_brand'],
  'the-yeon': ['korea', 'safe', 'known_k_beauty_brand'],
  'thank-you-farmer': ['korea', 'safe', 'known_k_beauty_brand'],
  'tirtir': ['korea', 'safe', 'known_k_beauty_brand'],
  'tiam': ['korea', 'safe', 'known_k_beauty_brand'],
  'tocobo': ['korea', 'safe', 'known_k_beauty_brand'],
  'tony': ['korea', 'review', 'verify_brand_slug'],
  'tonymoly': ['korea', 'safe', 'known_k_beauty_brand'],
  'torriden': ['korea', 'safe', 'known_k_beauty_brand'],
  'vt-cosmetics': ['korea', 'safe', 'known_k_beauty_brand'],
  'w-dressroom': ['korea', 'safe', 'known_korean_brand'],
  'welcos': ['korea', 'safe', 'known_korean_brand'],
  'welcos-confume': ['korea', 'safe', 'known_korean_brand'],
  'wskinlab': ['korea', 'safe', 'known_k_beauty_brand'],
  'yadah': ['korea', 'safe', 'known_k_beauty_brand'],
  'young-plan': ['korea', 'review', 'verify_brand_origin'],

  // Japan
  'andhoney': ['japan', 'safe', 'known_j_beauty_brand'],
  'biore': ['japan', 'safe', 'known_j_beauty_brand'],
  'cezanne': ['japan', 'safe', 'known_j_beauty_brand'],
  'cow-brand': ['japan', 'safe', 'known_j_beauty_brand'],
  'daiso': ['japan', 'safe', 'known_japanese_brand'],
  'dhc': ['japan', 'safe', 'known_j_beauty_brand'],
  'fino': ['japan', 'safe', 'known_j_beauty_brand'],
  'hada-labo': ['japan', 'safe', 'known_j_beauty_brand'],
  'harada': ['japan', 'safe', 'known_japanese_brand'],
  'kiku': ['japan', 'review', 'verify_brand_slug'],
  'kikumasamune': ['japan', 'safe', 'known_j_beauty_brand'],
  'kodomo': ['japan', 'safe', 'known_japanese_brand'],
  'kose': ['japan', 'safe', 'known_j_beauty_brand'],
  'lion': ['japan', 'safe', 'known_japanese_brand'],
  'lucido-l': ['japan', 'safe', 'known_j_beauty_brand'],
  'mandom': ['japan', 'safe', 'known_japanese_brand'],
  'melano-cc': ['japan', 'safe', 'known_j_beauty_brand'],
  'naturie-hatomagi': ['japan', 'safe', 'known_j_beauty_brand'],
  'omi-brotherhood': ['japan', 'safe', 'known_j_beauty_brand'],
  'reikhaku': ['japan', 'safe', 'known_j_beauty_brand'],
  'rohto': ['japan', 'safe', 'known_j_beauty_brand'],
  'rohto-mentholatum': ['japan', 'safe', 'known_j_beauty_brand'],
  'sana': ['japan', 'safe', 'known_j_beauty_brand'],
  'shiseido': ['japan', 'safe', 'known_j_beauty_brand'],
  'skin-aqua': ['japan', 'safe', 'known_j_beauty_brand'],
  'skinaqua': ['japan', 'safe', 'official_rohto_japan_product_line'],
  'skinlife': ['japan', 'safe', 'known_j_beauty_brand'],
  'syoss': ['japan', 'safe', 'owned_by_japanese_company'],
  'yanagiya': ['japan', 'safe', 'known_j_beauty_brand'],

  // USA
  'absolute-new-york': ['usa', 'safe', 'known_usa_brand'],
  'aztec-secret': ['usa', 'safe', 'known_usa_brand'],
  'aveeno': ['usa', 'safe', 'known_usa_brand'],
  'bath-and-body-works': ['usa', 'safe', 'known_usa_brand'],
  'bath-body-works': ['usa', 'safe', 'known_usa_brand'],
  'cerave': ['usa', 'safe', 'known_usa_brand'],
  'cetaphil': ['usa', 'safe', 'known_usa_brand'],
  'clean-and-clear': ['usa', 'safe', 'known_usa_brand'],
  'differin': ['usa', 'safe', 'known_usa_brand'],
  'dove': ['usa', 'safe', 'global_brand_map_usa'],
  'good-molecules': ['usa', 'safe', 'known_usa_brand'],
  'j-cat': ['usa', 'safe', 'known_usa_brand'],
  'gillette': ['usa', 'safe', 'known_usa_brand'],
  'l-a-girl': ['usa', 'safe', 'known_usa_brand'],
  'lady-speed': ['usa', 'safe', 'known_usa_brand'],
  'lubriderm': ['usa', 'safe', 'known_usa_brand'],
  'm-a-c': ['usa', 'safe', 'known_usa_brand'],
  'maybelline': ['usa', 'safe', 'known_usa_brand'],
  'mielle': ['usa', 'safe', 'known_usa_brand'],
  'nair': ['usa', 'safe', 'known_usa_brand'],
  'neutrogena': ['usa', 'safe', 'known_usa_brand'],
  'nivea': ['germany', 'safe', 'known_german_brand'],
  'nyx': ['usa', 'safe', 'known_usa_brand'],
  'oral-b': ['usa', 'safe', 'known_usa_brand'],
  'palmers': ['usa', 'safe', 'known_usa_brand'],
  'panoxyl': ['usa', 'safe', 'known_usa_brand'],
  'paulas-choice': ['usa', 'safe', 'known_usa_brand'],
  'philosophy': ['usa', 'safe', 'known_usa_brand'],
  'remington': ['usa', 'safe', 'known_usa_brand'],
  'sheglam': ['usa', 'safe', 'known_usa_brand'],
  'st-ives': ['usa', 'safe', 'known_usa_brand'],
  'topicals': ['usa', 'safe', 'known_usa_brand'],
  'tresemme': ['usa', 'safe', 'global_brand_map_usa'],
  'vanicream': ['usa', 'safe', 'known_usa_brand'],
  'vaseline': ['usa', 'safe', 'legacy_usa_brand_unilever'],
  'wet-n-wild': ['usa', 'safe', 'known_usa_brand'],

  // UK
  'astral': ['uk', 'safe', 'known_uk_brand'],
  'boots': ['uk', 'safe', 'known_uk_brand'],
  'botanics': ['uk', 'safe', 'known_uk_brand'],
  'beauty-formulas': ['uk', 'safe', 'known_uk_brand'],
  'beauty-formulas-skin': ['uk', 'safe', 'known_uk_brand'],
  'durex': ['uk', 'safe', 'official_reckitt_uk_brand'],
  'femi-fresh': ['uk', 'safe', 'known_uk_brand'],
  'rimmel': ['uk', 'safe', 'known_uk_brand'],
  'simple': ['uk', 'safe', 'known_uk_brand'],
  'sudocrem': ['uk', 'safe', 'known_uk_brand'],
  'superdrug': ['uk', 'safe', 'known_uk_brand'],
  'technic': ['uk', 'safe', 'known_uk_brand'],
  'the-body-shop': ['uk', 'safe', 'known_uk_brand'],
  'the-inkey-list': ['uk', 'safe', 'known_uk_brand'],
  'veet': ['uk', 'safe', 'known_uk_brand'],
  'w7': ['uk', 'safe', 'known_uk_brand'],
  'xpel': ['uk', 'safe', 'known_uk_brand'],

  // France / Europe
  'avene': ['france', 'safe', 'known_french_brand'],
  'bioderma': ['france', 'safe', 'known_french_brand'],
  'caudalie': ['france', 'safe', 'known_french_brand'],
  'embryolisse': ['france', 'safe', 'known_french_brand'],
  'garnier': ['france', 'safe', 'known_french_brand'],
  'la-roche-posay': ['france', 'safe', 'known_french_brand'],
  'loreal': ['france', 'safe', 'known_french_brand'],
  'eucerin': ['germany', 'safe', 'known_german_brand'],
  'sebamed': ['germany', 'safe', 'known_german_brand'],
  'seba-med': ['germany', 'safe', 'known_german_brand'],
  'bi-es': ['poland', 'safe', 'known_polish_brand'],
  'enchanteur': ['malaysia', 'safe', 'known_malaysian_brand'],
  'the-ordinary': ['canada', 'safe', 'official_deciem_toronto_canada'],

  // India / South Asia
  'aqualogica': ['india', 'safe', 'known_indian_brand'],
  'deconstruct': ['india', 'safe', 'known_indian_brand'],
  'dot-and-key': ['india', 'safe', 'known_indian_brand'],
  'dr-shethas': ['india', 'safe', 'known_indian_brand'],
  'insight': ['india', 'safe', 'known_indian_brand'],
  'lakme': ['india', 'safe', 'known_indian_brand'],
  'minimalist': ['india', 'safe', 'known_indian_brand'],
  'mamaearth': ['india', 'safe', 'known_indian_brand'],
  'muuchstac': ['india', 'safe', 'known_indian_brand'],
  'swiss-beauty': ['india', 'safe', 'official_indian_beauty_brand'],
  'the-derma-co': ['india', 'safe', 'known_indian_brand'],
  'ponds': ['usa', 'safe', 'legacy_usa_brand_unilever'],
  'wishcare': ['india', 'safe', 'known_indian_brand'],
  'vatika': ['uae', 'safe', 'dabur_uae_or_india_group_review_if_needed'],
  'vatika-naturals': ['uae', 'safe', 'dabur_uae_or_india_group_review_if_needed'],
  'rivaj': ['pakistan', 'safe', 'known_pakistani_brand'],
  'rivaj': ['pakistan', 'safe', 'known_pakistani_brand'],
  'savlon': ['bangladesh', 'safe', 'bd_market_brand'],

  // Thailand / China / global others
  'mistine': ['thailand', 'safe', 'known_thai_brand'],
  'srichand': ['thailand', 'safe', 'known_thai_brand'],
  'kojie-san': ['philippines', 'safe', 'official_bevi_philippines_brand'],
  'bioaqua': ['china', 'safe', 'known_chinese_brand'],
  'beauty-glazed': ['china', 'safe', 'known_chinese_brand'],
  'fayankou': ['china', 'safe', 'known_chinese_brand'],
  'fenyi': ['china', 'safe', 'known_chinese_brand'],
  'handaiyan': ['china', 'safe', 'known_chinese_brand'],
  'hojo': ['china', 'review', 'verify_brand_origin'],
  'hojo-luminous': ['china', 'review', 'verify_brand_origin'],
  'imagic': ['china', 'safe', 'known_chinese_brand'],
  'karite': ['china', 'safe', 'known_chinese_brand'],
  'keli': ['china', 'safe', 'known_chinese_brand'],
  'kiss-beauty': ['china', 'safe', 'known_chinese_brand'],
  'laikou': ['china', 'safe', 'known_chinese_brand'],
  'lanbena': ['china', 'safe', 'known_chinese_brand'],
  'maange': ['china', 'safe', 'known_chinese_brand'],
  'sadoer': ['china', 'safe', 'known_chinese_brand'],
  'sweet-beauty': ['china', 'review', 'verify_brand_origin'],
  'valentine': ['china', 'review', 'verify_brand_origin'],
  'xisjoem': ['china', 'review', 'verify_brand_origin'],
  'zeze': ['china', 'review', 'verify_brand_origin'],

  // Store/internal or not a real brand
  'emart-combo': ['internal', 'review', 'store_combo_not_origin_brand'],
  'emart-exclusive': ['internal', 'review', 'store_label_not_origin_brand'],
};

function csvEscape(value) {
  const string = String(value ?? '');
  return /[",\n\r\t]/.test(string) ? `"${string.replaceAll('"', '""')}"` : string;
}

function toCsv(rows, headers) {
  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ].join('\n') + '\n';
}

function wpDbQuery(sql) {
  return execFileSync('wp', ['--path=' + WP_PATH, '--allow-root', 'db', 'query', sql, '--skip-column-names'], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 40,
  }).trim();
}

function parseTsv(output, columns) {
  if (!output) return [];
  return output.split('\n').filter(Boolean).map((line) => {
    const values = line.split('\t');
    return Object.fromEntries(columns.map((column, index) => [column, values[index] ?? '']));
  });
}

const brandRows = parseTsv(wpDbQuery(`
SELECT t.term_id,t.name,t.slug,tt.count
FROM wp4h_terms t
JOIN wp4h_term_taxonomy tt ON tt.term_id=t.term_id
WHERE tt.taxonomy='product_brand' AND tt.count > 0
ORDER BY tt.count DESC,t.name;
`), ['term_id', 'brand_name', 'brand_slug', 'product_count']);

const productRows = parseTsv(wpDbQuery(`
SELECT p.ID,p.post_title,p.post_name,t.term_id,t.name,t.slug
FROM wp4h_posts p
JOIN wp4h_term_relationships tr ON tr.object_id=p.ID
JOIN wp4h_term_taxonomy tt ON tt.term_taxonomy_id=tr.term_taxonomy_id
JOIN wp4h_terms t ON t.term_id=tt.term_id
WHERE p.post_type='product'
  AND p.post_status='publish'
  AND tt.taxonomy='product_brand'
ORDER BY t.slug,p.ID;
`), ['product_id', 'product_name', 'product_slug', 'brand_term_id', 'brand_name', 'brand_slug']);

const productOriginCategories = parseTsv(wpDbQuery(`
SELECT p.ID,GROUP_CONCAT(DISTINCT t.slug ORDER BY t.slug SEPARATOR '|')
FROM wp4h_posts p
JOIN wp4h_term_relationships tr ON tr.object_id=p.ID
JOIN wp4h_term_taxonomy tt ON tt.term_taxonomy_id=tr.term_taxonomy_id
JOIN wp4h_terms t ON t.term_id=tt.term_id
WHERE p.post_type='product'
  AND p.post_status='publish'
  AND tt.taxonomy='product_cat'
  AND t.slug IN ('korean-beauty','japanese-beauty','k-beauty-j-beauty')
GROUP BY p.ID;
`), ['product_id', 'current_origin_categories']);

const currentOriginByProduct = new Map(productOriginCategories.map((row) => [row.product_id, row.current_origin_categories]));

const brandPlan = brandRows.map((brand) => {
  const mapped = ORIGIN_BY_BRAND_SLUG[brand.brand_slug];
  if (!mapped) {
    return {
      ...brand,
      proposed_origin: '',
      confidence: 'unknown',
      source: 'needs_research_or_user_review',
      proposed_wp_term: '',
      action: 'review_before_assign',
    };
  }

  const [origin, confidence, source] = mapped;
  return {
    ...brand,
    proposed_origin: origin,
    confidence,
    source,
    proposed_wp_term: origin && !['internal'].includes(origin) ? origin : '',
    action: confidence === 'safe' ? 'can_assign_after_review' : 'review_before_assign',
  };
});

const planByBrandSlug = new Map(brandPlan.map((row) => [row.brand_slug, row]));

const productPlan = productRows.map((product) => {
  const brand = planByBrandSlug.get(product.brand_slug);
  const proposedOrigin = brand?.proposed_origin || '';
  return {
    product_id: product.product_id,
    product_slug: product.product_slug,
    product_name: product.product_name,
    brand_name: product.brand_name,
    brand_slug: product.brand_slug,
    current_origin_categories: currentOriginByProduct.get(product.product_id) || '',
    proposed_origin: proposedOrigin,
    confidence: brand?.confidence || 'unknown',
    source: brand?.source || 'needs_research_or_user_review',
    action: proposedOrigin && !['internal'].includes(proposedOrigin) && brand?.confidence === 'safe'
      ? 'dry_run_assign_pa_origin'
      : 'manual_review',
  };
});

const summary = {
  'brands_total': brandPlan.length,
  'products_with_brand_total': productPlan.length,
  'brands_safe': brandPlan.filter((row) => row.confidence === 'safe').length,
  'brands_review': brandPlan.filter((row) => row.confidence === 'review').length,
  'brands_unknown': brandPlan.filter((row) => row.confidence === 'unknown').length,
  'products_safe': productPlan.filter((row) => row.action === 'dry_run_assign_pa_origin').length,
  'products_review': productPlan.filter((row) => row.action === 'manual_review').length,
  'by_origin': {},
};

for (const row of brandPlan) {
  const origin = row.proposed_origin || 'unknown';
  summary.by_origin[origin] = (summary.by_origin[origin] || 0) + Number(row.product_count || 0);
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'brand-origin-dry-run.csv'), toCsv(brandPlan, [
  'term_id',
  'brand_name',
  'brand_slug',
  'product_count',
  'proposed_origin',
  'confidence',
  'source',
  'proposed_wp_term',
  'action',
]));
writeFileSync(join(OUT_DIR, 'product-origin-dry-run.csv'), toCsv(productPlan, [
  'product_id',
  'product_slug',
  'product_name',
  'brand_name',
  'brand_slug',
  'current_origin_categories',
  'proposed_origin',
  'confidence',
  'source',
  'action',
]));
writeFileSync(join(OUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
writeFileSync(join(OUT_DIR, 'needs-review.csv'), toCsv(
  brandPlan.filter((row) => row.confidence !== 'safe'),
  ['term_id', 'brand_name', 'brand_slug', 'product_count', 'proposed_origin', 'confidence', 'source', 'action'],
));

console.log(JSON.stringify({ outDir: OUT_DIR, ...summary }, null, 2));
