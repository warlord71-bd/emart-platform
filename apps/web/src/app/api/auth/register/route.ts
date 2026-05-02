import { NextRequest, NextResponse } from 'next/server';

function getWordPressBaseUrl() {
  return (
    process.env.WOO_INTERNAL_URL ||
    (process.env.NODE_ENV === 'production' ? 'http://127.0.0.1' : '') ||
    process.env.NEXT_PUBLIC_WOO_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://e-mart.com.bd'
  ).replace(/\/$/, '');
}

function getWordPressHeaders() {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (getWordPressBaseUrl().startsWith('http://127.0.0.1')) {
    headers.Host = 'e-mart.com.bd';
  }

  return headers;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(`${getWordPressBaseUrl()}/wp-json/emart/v1/customer/register`, {
      method: 'POST',
      headers: getWordPressHeaders(),
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.message || data?.error || 'Could not create account' },
        { status: response.status || 500 },
      );
    }

    return NextResponse.json({
      success: true,
      pending_verification: Boolean(data?.pending_verification),
      message: data?.message || 'Account created. Please check your inbox and verify your email address.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 },
    );
  }
}
