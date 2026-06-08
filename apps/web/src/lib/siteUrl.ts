const DEFAULT_SITE_URL = 'https://e-mart.com.bd';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

function getPublicSiteUrl(value?: string): string {
  if (!value) return DEFAULT_SITE_URL;

  try {
    const url = new URL(value);
    if ((url.protocol === 'http:' || url.protocol === 'https:') && !LOCAL_HOSTS.has(url.hostname)) {
      return value.replace(/\/$/, '');
    }
  } catch {
    return DEFAULT_SITE_URL;
  }

  return DEFAULT_SITE_URL;
}

export const SITE_URL = getPublicSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

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
