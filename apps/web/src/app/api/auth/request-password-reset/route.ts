import { NextRequest, NextResponse } from 'next/server';

function getWordPressBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_WOO_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://e-mart.com.bd'
  ).replace(/\/$/, '');
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
      headers: { 'Content-Type': 'application/json' },
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
