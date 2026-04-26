import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { extractStoredSkinQuiz } from '@/lib/skinQuizAccount';
import { getCustomer } from '@/lib/woocommerce';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function loadStoredSkinQuiz(userId?: number) {
  if (!userId) {
    return null;
  }

  const customer = await getCustomer(userId);
  return extractStoredSkinQuiz(customer?.meta_data);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as {
      id?: number;
      email?: string;
      username?: string;
      first_name?: string;
      last_name?: string;
    } | undefined;

    if (sessionUser?.id && sessionUser.email) {
      const skinQuiz = await loadStoredSkinQuiz(sessionUser.id);
      return NextResponse.json({
        authenticated: true,
        user: {
          id: sessionUser.id,
          email: sessionUser.email,
          username: sessionUser.username || sessionUser.email.split('@')[0],
          first_name: sessionUser.first_name || '',
          last_name: sessionUser.last_name || '',
        },
        skin_quiz: skinQuiz,
      });
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('wc_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = JSON.parse(sessionCookie.value);
    const skinQuiz = await loadStoredSkinQuiz(user?.id);
    return NextResponse.json({ authenticated: true, user, skin_quiz: skinQuiz });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get user', authenticated: false },
      { status: 500 }
    );
  }
}
