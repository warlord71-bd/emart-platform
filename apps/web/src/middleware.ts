import { NextRequest, NextResponse } from 'next/server';

// Junk/test WordPress pages that were indexed and should be permanently removed.
// 410 Gone signals to Google that these URLs are dead and should be dropped from index.
const GONE_PATHS = new Set([
  '/fdght', '/test-page', '/sample-page', '/hello-world',
  '/elementor-57159', '/compare-2',
  // WP client portal pages — private, no public Next.js equivalent
  '/clients', '/clients-2', '/clients-3', '/clients-4', '/clients-5',
  '/clients-6', '/clients-7', '/clients-8', '/clients-9', '/clients-10',
]);

// Query parameters that pollute canonical URLs — strip and 301 to clean path
const STRIP_PARAMS = [
  'srsltid',      // Google Search result session link ID
  'orderby',      // WooCommerce sort parameter
  'order',
  'per_page',
  'paged',
  'shop_view',
  'add-to-cart',  // WooCommerce add-to-cart shortcut
  'add_to_cart',
];

export function middleware(req: NextRequest): NextResponse | undefined {
  const pathname = req.nextUrl.pathname.replace(/\/$/, '') || '/';

  // Return 410 Gone for permanently removed junk/test pages
  if (GONE_PATHS.has(pathname)) {
    return new NextResponse(null, { status: 410 });
  }

  const url = req.nextUrl.clone();
  let stripped = false;

  for (const param of STRIP_PARAMS) {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      stripped = true;
    }
  }

  if (stripped) {
    return NextResponse.redirect(url, { status: 301 });
  }

  return undefined;
}

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: ['/((?!_next|api|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff2?)).*)'],
};
