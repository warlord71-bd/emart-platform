import { NextRequest, NextResponse } from 'next/server';

function getWordPressBaseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://e-mart.com.bd').replace(/\/$/, '');
}

function getWordPressHeaders() {
  return { 'Content-Type': 'application/json' };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const siteUrl = (
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://e-mart.com.bd'
    ).replace(/\/$/, '');

    const response = await fetch(`${getWordPressBaseUrl()}/wp-json/emart/v1/customer/register`, {
      method: 'POST',
      headers: getWordPressHeaders(),
      body: JSON.stringify({
        ...body,
        verification_url: `${siteUrl}/api/auth/verify-email`,
      }),
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
