import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { username, password, email, first_name, last_name } = await request.json();

    if (!username || !password || !email) {
      return NextResponse.json(
        { error: 'Username, password, and email are required' },
        { status: 400 }
      );
    }

    // In production, this would create a customer in WooCommerce via API
    // For now, simulate registration
    const customerData = {
      id: Date.now(),
      username,
      email,
      first_name: first_name || '',
      last_name: last_name || '',
      role: 'customer',
      date_created: new Date().toISOString(),
    };

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('wc_session', JSON.stringify(customerData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: customerData,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
