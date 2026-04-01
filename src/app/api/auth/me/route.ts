import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('wc_session');

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    const user = JSON.parse(sessionCookie.value);
    
    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user', authenticated: false },
      { status: 500 }
    );
  }
}
