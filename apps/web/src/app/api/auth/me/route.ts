import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('wc_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = JSON.parse(sessionCookie.value);
    return NextResponse.json({ authenticated: true, user });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get user', authenticated: false },
      { status: 500 }
    );
  }
}
