export function formatCommerceNumber(value: unknown): string {
  const amount = parseCommerceNumber(value);
  if (amount === null) return '0';
  // Avoid toLocaleString('en-BD'): on Bangladeshi Android devices the browser
  // locale resolves to Bengali numerals (৩৬০), while Node.js outputs ASCII
  // digits (360), causing React hydration mismatches on every price element.
  return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatBDT(value: unknown): string {
  return `৳${formatCommerceNumber(value)}`;
}

export function formatDiscountPercent(value: unknown): number {
  const amount = parseCommerceNumber(value);
  if (amount === null || amount <= 0) return 0;
  return Math.round(amount);
}

const BENGALI_DIGITS = '০১২৩৪৫৬৭৮৯';

// Bangladeshi mobile keyboards often default to Bengali numerals (০-৯);
// phone fields expect ASCII digits, so normalize as the user types.
export function normalizePhoneDigits(value: string): string {
  return value.replace(/[০-৯]/g, (digit) => String(BENGALI_DIGITS.indexOf(digit)));
}

export function stripHtml(value: unknown): string {
  if (value === null || value === undefined) return '';

  return String(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseCommerceNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;

  const normalized = typeof value === 'number'
    ? value
    : Number.parseFloat(String(value).replace(/[^\d.-]/g, ''));

  return Number.isFinite(normalized) ? normalized : null;
}
