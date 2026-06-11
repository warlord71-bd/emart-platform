import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function getWordPressBaseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://e-mart.com.bd').replace(/\/$/, '');
}

function getWordPressHeaders() {
  return { 'Content-Type': 'application/json' };
}

export async function POST(request: NextRequest) {
  try {
    const { email, phone } = await request.json();
    const normalizedEmail = String(email || '').trim();
    const normalizedPhone = String(phone || '').trim();

    if (!normalizedEmail || !normalizedPhone) {
      return NextResponse.json(
        { error: 'Email and phone number are required' },
        { status: 400 },
      );
    }

    const response = await fetch(`${getWordPressBaseUrl()}/wp-json/emart/v1/customer/login-by-phone`, {
      method: 'POST',
      headers: getWordPressHeaders(),
      body: JSON.stringify({ email: normalizedEmail, phone: normalizedPhone }),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data?.user?.id) {
      return NextResponse.json(
        { error: data?.message || data?.error || 'No account found with that email and phone' },
        { status: response.status || 401 },
      );
    }

    const cookieStore = await cookies();
    cookieStore.set('wc_session', JSON.stringify(data.user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
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
    console.error('Login by phone error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 },
    );
  }
}
