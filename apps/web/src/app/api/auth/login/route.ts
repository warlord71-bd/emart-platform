import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function getWordPressBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_WOO_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://e-mart.com.bd'
  ).replace(/\/$/, '');
}

export async function POST(request: NextRequest) {
  try {
    const { login, password } = await request.json();
    const normalizedLogin = String(login || '').trim();

    if (!normalizedLogin || !password) {
      return NextResponse.json(
        { error: 'Email/username and password are required' },
        { status: 400 },
      );
    }

    const response = await fetch(`${getWordPressBaseUrl()}/wp-json/emart/v1/customer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: normalizedLogin, password }),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data?.user?.id) {
      return NextResponse.json(
        { error: data?.message || data?.error || 'Invalid email/username or password' },
        { status: response.status || 401 },
      );
    }

    const cookieStore = await cookies();
    cookieStore.set('wc_session', JSON.stringify(data.user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: data.user,
      token: data.token,
      expires_at: data.expires_at,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 },
    );
  }
}
