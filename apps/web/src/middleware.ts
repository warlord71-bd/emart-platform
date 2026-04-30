import { NextRequest, NextResponse } from 'next/server';

// Query parameters that pollute canonical URLs — strip and 301 to clean path
const STRIP_PARAMS = [
  'srsltid',      // Google Search result session link ID
  'orderby',      // WooCommerce sort parameter
  'add-to-cart',  // WooCommerce add-to-cart shortcut
  'add_to_cart',
];

export function middleware(req: NextRequest): NextResponse | undefined {
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
