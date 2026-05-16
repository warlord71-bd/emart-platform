import { NextRequest, NextResponse } from 'next/server';

const WP_INTERNAL = process.env.WOO_INTERNAL_URL || 'http://127.0.0.1';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email || '').trim();
    const password = (body.password || '').trim();
    const fullName = (body.name || body.full_name || '').trim();
    const phone = (body.phone || '').trim();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Name, email and password are required' },
        { status: 400 }
      );
    }

    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || fullName;
    const lastName = nameParts.slice(1).join(' ') || '';
    const username = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase() +
      '_' + Math.floor(1000 + Math.random() * 9000);

    const res = await fetch(`${WP_INTERNAL}/wp-json/emart/v1/customer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email, first_name: firstName, last_name: lastName }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message || 'Registration failed. Please try again.' },
        { status: res.status }
      );
    }

    // Store phone on the new customer if provided
    if (phone && data.success) {
      // Fire-and-forget — don't block registration if this fails
      fetch(`${WP_INTERNAL}/wp-json/emart/v1/customer/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: email, password }),
      }).catch(() => null);
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
