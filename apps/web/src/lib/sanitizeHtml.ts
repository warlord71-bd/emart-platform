const DROP_BLOCKS =
  /<(script|style|iframe|object|embed|form|input|button|textarea|select|option|link|meta|base)\b[^>]*>[\s\S]*?<\/\1>/gi;

const DROP_SELF_CLOSING =
  /<(script|style|iframe|object|embed|form|input|button|textarea|select|option|link|meta|base)\b[^>]*\/?>/gi;

const ALLOWED_TAGS = new Set([
  'a',
  'b',
  'br',
  'blockquote',
  'code',
  'div',
  'em',
  'figcaption',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  'span',
  'strong',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
]);

const GLOBAL_ATTRS = new Set(['aria-label', 'title']);
const ATTRS_BY_TAG: Record<string, Set<string>> = {
  a: new Set(['href', 'target', 'rel', 'aria-label', 'title']),
  img: new Set(['src', 'alt', 'width', 'height', 'loading', 'title']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan', 'scope']),
};

function isSafeUrl(value: string): boolean {
  const trimmed = value.trim().replace(/[\u0000-\u001f\u007f\s]+/g, '');
  if (!trimmed) return false;
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(trimmed)) return true;
  return false;
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function sanitizeAttributes(tagName: string, rawAttributes: string): string {
  const allowedAttrs = ATTRS_BY_TAG[tagName] || GLOBAL_ATTRS;
  const attrs: string[] = [];
  const attrPattern = /([a-z0-9:-]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/gi;
  let match: RegExpExecArray | null;

  while ((match = attrPattern.exec(rawAttributes))) {
    const name = match[1].toLowerCase();
    if (name.startsWith('on') || name === 'style' || name === 'srcset') continue;
    if (!allowedAttrs.has(name) && !GLOBAL_ATTRS.has(name)) continue;

    const value = match[3] ?? match[4] ?? match[5] ?? '';
    if ((name === 'href' || name === 'src') && !isSafeUrl(value)) continue;
    if ((name === 'width' || name === 'height' || name === 'colspan' || name === 'rowspan') && !/^\d{1,4}$/.test(value)) continue;
    if (name === 'target' && value !== '_blank') continue;
    if (name === 'loading' && value !== 'lazy' && value !== 'eager') continue;

    attrs.push(`${name}="${escapeAttribute(value)}"`);
  }

  if (tagName === 'a') {
    const hasTargetBlank = attrs.includes('target="_blank"');
    const hasRel = attrs.some((attr) => attr.startsWith('rel='));
    if (hasTargetBlank && !hasRel) attrs.push('rel="noopener noreferrer"');
  }

  return attrs.length ? ` ${attrs.join(' ')}` : '';
}

export function sanitizeHtml(value: string, fallback = ''): string {
  if (!value) return fallback;

  return value
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(DROP_BLOCKS, '')
    .replace(DROP_SELF_CLOSING, '')
    .replace(/<\s*\/?\s*([a-z0-9:-]+)([^>]*)>/gi, (match, rawTagName: string, rawAttributes: string) => {
      const tagName = rawTagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tagName)) return '';
      const isClosing = /^<\s*\//.test(match);
      if (isClosing) return `</${tagName}>`;
      const attrs = sanitizeAttributes(tagName, rawAttributes || '');
      const isVoid = tagName === 'br' || tagName === 'hr' || tagName === 'img';
      return `<${tagName}${attrs}${isVoid ? ' />' : '>'}`;
    });
}

export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
