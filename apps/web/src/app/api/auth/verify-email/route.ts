import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function getWordPressBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_WOO_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://e-mart.com.bd'
  ).replace(/\/$/, '');
}

function accountRedirect(request: NextRequest, params: Record<string, string>) {
  const origin = (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    request.nextUrl.origin
  ).replace(/\/$/, '');
  const url = new URL('/account', origin);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get('uid') || '';
  const token = request.nextUrl.searchParams.get('token') || '';

  if (!uid || !token) {
    return accountRedirect(request, { verified: '0', reason: 'missing' });
  }

  try {
    const response = await fetch(`${getWordPressBaseUrl()}/wp-json/emart/v1/customer/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, token }),
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data?.user?.id) {
      return accountRedirect(request, {
        verified: '0',
        reason: data?.message || data?.error || 'failed',
      });
    }

    const cookieStore = await cookies();
    cookieStore.set('wc_session', JSON.stringify(data.user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return accountRedirect(request, { verified: '1' });
  } catch (error) {
    console.error('Email verification error:', error);
    return accountRedirect(request, { verified: '0', reason: 'failed' });
  }
}
