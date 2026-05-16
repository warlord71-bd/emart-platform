import { NextRequest, NextResponse } from 'next/server';

const WP_INTERNAL = process.env.WOO_INTERNAL_URL || 'http://127.0.0.1';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const login = (body.login || body.email || '').trim();
    const password = (body.password || '').trim();

    if (!login || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const res = await fetch(`${WP_INTERNAL}/wp-json/emart/v1/customer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message || 'Invalid email or password' },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
