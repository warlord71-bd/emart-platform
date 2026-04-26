import { NextRequest, NextResponse } from 'next/server';
import type { SkinQuizResult } from '@/lib/skinQuiz';
import { buildSkinQuizCustomerMeta } from '@/lib/skinQuizAccount';
import { getCustomerByEmail, updateCustomer } from '@/lib/woocommerce';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getWordPressBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_WOO_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://e-mart.com.bd'
  ).replace(/\/$/, '');
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function saveQuizToCustomerAccount(email: string, result: SkinQuizResult) {
  const customer = await getCustomerByEmail(email);
  if (!customer) {
    return false;
  }

  const meta_data = buildSkinQuizCustomerMeta(customer.meta_data, result);
  const updatedCustomer = await updateCustomer(customer.id, { meta_data });
  return Boolean(updatedCustomer);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const subscribe = Boolean(body?.subscribe);
    const answers = body?.answers;
    const result = body?.result as SkinQuizResult | undefined;

    if (name.length < 2) {
      return NextResponse.json({ error: 'Please enter your name' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    if (!answers || !result) {
      return NextResponse.json({ error: 'Quiz result is incomplete' }, { status: 400 });
    }

    const response = await fetch(`${getWordPressBaseUrl()}/wp-json/emart/v1/skin-quiz/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        subscribe,
        answers,
        result,
      }),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.message || data?.error || 'Could not send routine email' },
        { status: response.status || 500 },
      );
    }

    const savedToAccount = await saveQuizToCustomerAccount(email, result);

    return NextResponse.json({
      success: true,
      subscribed: Boolean(data?.subscribed),
      savedToAccount,
      message: data?.message || 'Routine email sent',
    });
  } catch (error) {
    console.error('Skin quiz route error:', error);
    return NextResponse.json(
      { error: 'Routine email failed' },
      { status: 500 },
    );
  }
}
