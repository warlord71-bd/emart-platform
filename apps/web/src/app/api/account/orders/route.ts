import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCustomerOrders } from '@/lib/woocommerce';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { id?: number } | undefined;
    if (sessionUser?.id) {
      const orders = await getCustomerOrders(sessionUser.id);
      return NextResponse.json({ orders }, { status: 200 });
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('wc_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = JSON.parse(sessionCookie.value) as { id?: number };
    if (!user?.id) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const orders = await getCustomerOrders(user.id);
    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load orders' },
      { status: 500 },
    );
  }
}
