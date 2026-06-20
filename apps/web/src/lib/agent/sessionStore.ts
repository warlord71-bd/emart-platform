interface SessionContext {
  skinType?: string;
  concerns?: string[];
  preferredBrands?: string[];
  updatedAt: number;
}

const TTL = 30 * 60 * 1000; // 30 minutes
const sessions = new Map<string, SessionContext>();

function cleanup() {
  const now = Date.now();
  for (const [id, ctx] of sessions) {
    if (now - ctx.updatedAt > TTL) sessions.delete(id);
  }
}

export function getSession(id: string): SessionContext | undefined {
  cleanup();
  return sessions.get(id);
}

export function updateSession(id: string, partial: Partial<Omit<SessionContext, 'updatedAt'>>) {
  cleanup();
  const existing = sessions.get(id) || { updatedAt: Date.now() };
  sessions.set(id, { ...existing, ...partial, updatedAt: Date.now() });
}

export function buildContextNote(id: string): string {
  const ctx = getSession(id);
  if (!ctx) return '';

  const parts: string[] = [];
  if (ctx.skinType) parts.push(`Customer's skin type: ${ctx.skinType}`);
  if (ctx.concerns?.length) parts.push(`Skin concerns: ${ctx.concerns.join(', ')}`);
  if (ctx.preferredBrands?.length) parts.push(`Preferred brands: ${ctx.preferredBrands.join(', ')}`);

  return parts.length
    ? `\n\n## Remembered from this conversation\n${parts.join('\n')}`
    : '';
}

const SKIN_TYPES = ['oily', 'dry', 'combination', 'sensitive', 'normal', 'acne-prone'];
const CONCERNS = [
  'acne', 'blemish', 'pores', 'oil control', 'dryness', 'hydration',
  'brightening', 'dark spot', 'pigmentation', 'melasma',
  'anti-aging', 'wrinkle', 'fine lines', 'sensitivity', 'redness',
];

export function extractContext(messages: { role: string; content: string }[]): Partial<Omit<SessionContext, 'updatedAt'>> {
  const userText = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content.toLowerCase())
    .join(' ');

  const skinType = SKIN_TYPES.find((t) => userText.includes(t));
  const concerns = CONCERNS.filter((c) => userText.includes(c));

  const result: Partial<Omit<SessionContext, 'updatedAt'>> = {};
  if (skinType) result.skinType = skinType;
  if (concerns.length) result.concerns = concerns;
  return result;
}
