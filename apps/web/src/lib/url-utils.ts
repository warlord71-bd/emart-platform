/**
 * Utility functions for URL construction to prevent HTML entity encoding issues
 * Solves "amp;" appearing in URLs by ensuring proper ampersand handling
 */

export interface QueryParams {
  [key: string]: string | number | boolean | undefined | null;
}

/**
 * Safely construct a URL with query parameters
 * Prevents HTML entity encoding of ampersands
 *
 * @example
 * buildUrl('/shop', { category: 'face-care', page: 1 })
 * // Returns: /shop?category=face-care&page=1
 */
export function buildUrl(pathname: string, params?: QueryParams): string {
  if (!params || Object.keys(params).length === 0) {
    return pathname;
  }

  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const queryString = queryParams.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

/**
 * Add or update a single query parameter in a URL
 *
 * @example
 * addQueryParam('/shop?category=face-care', 'page', '2')
 * // Returns: /shop?category=face-care&page=2
 */
export function addQueryParam(url: string, key: string, value: string | number): string {
  const [pathname, search] = url.split('?');
  const params = new URLSearchParams(search);
  params.set(key, String(value));

  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

/**
 * Remove a query parameter from a URL
 *
 * @example
 * removeQueryParam('/shop?category=face-care&page=2', 'page')
 * // Returns: /shop?category=face-care
 */
export function removeQueryParam(url: string, key: string): string {
  const [pathname, search] = url.split('?');
  const params = new URLSearchParams(search);
  params.delete(key);

  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

/**
 * Get a query parameter value from a URL
 */
export function getQueryParam(url: string, key: string): string | null {
  const [, search] = url.split('?');
  if (!search) return null;

  const params = new URLSearchParams(search);
  return params.get(key);
}

/**
 * Ensure ampersands in URLs are not HTML-encoded
 * Decodes HTML entities that may have been encoded
 */
export function decodeHtmlEntities(str: string): string {
  if (!str) return str;

  const textarea = typeof document !== 'undefined' ? document.createElement('textarea') : null;
  if (textarea) {
    textarea.innerHTML = str;
    return textarea.value;
  }

  // Fallback for Node.js environment
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
