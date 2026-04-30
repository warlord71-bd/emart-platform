const DEFAULT_SITE_URL = 'https://e-mart.com.bd';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '');

export function absoluteUrl(path = ''): string {
  if (!path) return SITE_URL;

  try {
    const url = new URL(path);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.toString();
    }
  } catch {
    // Treat as a frontend path below.
  }

  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
