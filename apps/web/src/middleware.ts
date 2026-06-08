import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_SITE_URL = 'https://e-mart.com.bd';
const LOCAL_FRONTEND_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]']);

function publicUrl(pathname: string, search = ''): URL {
  const url = new URL(pathname, PUBLIC_SITE_URL);
  url.search = search;
  return url;
}

// Junk/test WordPress pages that were indexed and should be permanently removed.
// 410 Gone signals to Google that these URLs are dead and should be dropped from index.
const GONE_PATHS = new Set([
  '/fdght', '/test-page', '/sample-page', '/hello-world',
  '/elementor-57159', '/compare-2',
  // WP client portal pages — private, no public Next.js equivalent
  '/clients', '/clients-2', '/clients-3', '/clients-4', '/clients-5',
  '/clients-6', '/clients-7', '/clients-8', '/clients-9', '/clients-10',
]);

// Concern query-param → clean path redirect (old noindexed → new canonical SEO pages)
// /concerns?concern=acne-blemish-care → /concerns/acne-blemish-care
function handleConcernRedirect(req: NextRequest): NextResponse | undefined {
  if (req.nextUrl.pathname !== '/concerns') return undefined;
  const concern = req.nextUrl.searchParams.get('concern');
  if (!concern) return undefined;
  return NextResponse.redirect(publicUrl(`/concerns/${concern}`), { status: 301 });
}

// Query parameters that pollute canonical URLs — strip and 301 to clean path
const STRIP_PARAMS = [
  'srsltid',          // Google Search result session link ID
  'orderby',          // WooCommerce sort parameter
  'order',
  'per_page',
  'per_row',          // WooCommerce display param (products per row), ignored by Next.js shop
  'paged',
  'shop_view',
  'filter_brand',     // WooCommerce attribute-filter param, ignored by Next.js shop
  'add-to-cart',      // WooCommerce add-to-cart shortcut
  'add_to_cart',
  'add_to_wishlist',  // YITH Wishlist plugin shortcut
];

// Strip these params only when value matches a known Woo/plugin pattern
const STRIP_IF_VALUE: Record<string, readonly string[]> = {
  action: ['yith-woocompare-add-product'],  // YITH Compare plugin
  ref:    ['aftership'],                    // AfterShip tracking referrer
};

export function middleware(req: NextRequest): NextResponse | undefined {
  const hostname = req.nextUrl.hostname.toLowerCase();
  const hostHeader = (req.headers.get('host') || '').split(':')[0].toLowerCase();
  const forwardedHost = (req.headers.get('x-forwarded-host') || '').split(',')[0].split(':')[0].trim().toLowerCase();
  const isForwardedPublicRequest = forwardedHost && !LOCAL_FRONTEND_HOSTS.has(forwardedHost);

  if (
    process.env.NODE_ENV === 'production' &&
    !isForwardedPublicRequest &&
    (LOCAL_FRONTEND_HOSTS.has(hostname) || LOCAL_FRONTEND_HOSTS.has(hostHeader))
  ) {
    return NextResponse.redirect(new URL(`${req.nextUrl.pathname}${req.nextUrl.search}`, PUBLIC_SITE_URL), { status: 301 });
  }

  const pathname = req.nextUrl.pathname.replace(/\/$/, '') || '/';

  if (pathname === '/policy') {
    return NextResponse.redirect(publicUrl('/return-policy'), { status: 301 });
  }

  // Return 410 Gone for permanently removed junk/test pages
  if (GONE_PATHS.has(pathname)) {
    return new NextResponse(null, { status: 410 });
  }

  // /concerns?concern=slug → /concerns/slug (clean 301, no trailing query param)
  const concernRedirect = handleConcernRedirect(req);
  if (concernRedirect) return concernRedirect;

  // Strip old WordPress ?p= post ID parameter — redirect root to clean /
  if (pathname === '/' && req.nextUrl.searchParams.has('p')) {
    return NextResponse.redirect(publicUrl('/'), { status: 301 });
  }

  const url = req.nextUrl.clone();
  let stripped = false;

  for (const param of STRIP_PARAMS) {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      stripped = true;
    }
  }

  for (const [param, badValues] of Object.entries(STRIP_IF_VALUE)) {
    const val = url.searchParams.get(param);
    if (val && (badValues as readonly string[]).includes(val)) {
      url.searchParams.delete(param);
      if (param === 'action') url.searchParams.delete('id');  // co-present Woo compare ID
      stripped = true;
    }
  }

  if (stripped) {
    return NextResponse.redirect(publicUrl(url.pathname, url.search), { status: 301 });
  }

  return undefined;
}

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: ['/((?!_next|api|favicon\\.ico|.*\\.(?:avif|png|jpg|jpeg|gif|svg|webp|ico|css|js|woff2?)).*)'],
};
