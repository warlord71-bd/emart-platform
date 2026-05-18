import { NextRequest, NextResponse } from 'next/server';

function getWordPressBaseUrl() {
  return (
    process.env.WOO_INTERNAL_URL ||
    (process.env.NODE_ENV === 'production' ? 'http://127.0.0.1' : '') ||
    process.env.NEXT_PUBLIC_WOO_URL ||
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
    const { login } = await request.json();
    const normalizedLogin = String(login || '').trim();

    if (!normalizedLogin) {
      return NextResponse.json(
        { error: 'Email address or username is required' },
        { status: 400 },
      );
    }

    const response = await fetch(`${getWordPressBaseUrl()}/wp-json/emart/v1/customer/lost-password`, {
      method: 'POST',
      headers: getWordPressHeaders(),
      body: JSON.stringify({ login: normalizedLogin }),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.message || data?.error || 'Could not send reset email' },
        { status: response.status || 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: data?.message || 'If the account exists, a reset email has been sent.',
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Could not send reset email' },
      { status: 500 },
    );
  }
}
