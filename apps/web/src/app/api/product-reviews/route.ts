import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  createProductReview,
  getCustomerOrders,
  getProductReviews,
} from '@/lib/woocommerce';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getWordPressBaseUrl() {
  return (
    process.env.WOO_INTERNAL_URL ||
    (process.env.NODE_ENV === 'production' ? 'http://127.0.0.1' : '') ||
    process.env.NEXT_PUBLIC_WOO_URL ||
    'https://e-mart.com.bd'
  ).replace(/\/$/, '');
}

function getWordPressHeaders(extraHeaders: Record<string, string> = {}) {
  const headers: Record<string, string> = { ...extraHeaders };
  if (getWordPressBaseUrl().startsWith('http://127.0.0.1')) {
    headers.Host = 'e-mart.com.bd';
  }
  return headers;
}

interface ReviewUser {
  id: number;
  email: string;
  name: string;
}

async function getCurrentReviewUser(): Promise<ReviewUser | null> {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as {
    id?: number;
    email?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    username?: string;
  } | undefined;

  if (sessionUser?.id && sessionUser.email) {
    const name =
      sessionUser.name ||
      `${sessionUser.first_name || ''} ${sessionUser.last_name || ''}`.trim() ||
      sessionUser.username ||
      sessionUser.email.split('@')[0];

    return { id: sessionUser.id, email: sessionUser.email, name };
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('wc_session');
  if (!sessionCookie?.value) return null;

  try {
    const user = JSON.parse(sessionCookie.value) as {
      id?: number;
      email?: string;
      first_name?: string;
      last_name?: string;
      username?: string;
    };

    if (!user?.id || !user.email) return null;

    const name =
      `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
      user.username ||
      user.email.split('@')[0];

    return { id: user.id, email: user.email, name };
  } catch {
    return null;
  }
}

async function getMobileReviewUser(request: Request): Promise<ReviewUser | null> {
  const authorization = request.headers.get('authorization') || '';
  if (!/^Bearer\s+\S+/i.test(authorization)) return null;

  try {
    const response = await fetch(`${getWordPressBaseUrl()}/wp-json/emart/v1/customer/me`, {
      headers: getWordPressHeaders({ Authorization: authorization }),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));
    const user = data?.user;

    if (!response.ok || !user?.id || !user?.email) return null;

    const name =
      [user.first_name, user.last_name].filter(Boolean).join(' ').trim() ||
      user.name ||
      user.username ||
      user.email.split('@')[0];

    return { id: Number(user.id), email: user.email, name };
  } catch {
    return null;
  }
}

async function hasVerifiedPurchase(customerId: number, productId: number): Promise<boolean> {
  const validStatuses = new Set(['processing', 'completed']);
  const orders = await getCustomerOrders(customerId);

  return orders.some((order) => {
    if (!validStatuses.has(order.status)) return false;

    return order.line_items.some((item) => Number(item.product_id) === productId);
  });
}

function sanitizeReviewText(value: unknown): string {
  return String(value || '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2000);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = Number(searchParams.get('productId') || searchParams.get('product_id') || 0);
  const includeReviews = searchParams.get('includeReviews') !== '0';

  if (!productId) {
    return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
  }

  const user = await getCurrentReviewUser() || await getMobileReviewUser(request);

  if (!user && !includeReviews) {
    return NextResponse.json({
      authenticated: false,
      verifiedPurchase: false,
      alreadyReviewed: false,
      canReview: false,
    });
  }

  const reviews = await getProductReviews(productId);

  const verifiedPurchase = user ? await hasVerifiedPurchase(user.id, productId) : false;
  const alreadyReviewed = user
    ? reviews.some((review) => review.reviewer_email?.toLowerCase() === user.email.toLowerCase())
    : false;

  return NextResponse.json({
    ...(includeReviews ? { reviews } : {}),
    authenticated: Boolean(user),
    verifiedPurchase,
    alreadyReviewed,
    canReview: Boolean(user && !alreadyReviewed),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentReviewUser() || await getMobileReviewUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Please log in to leave a review.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const productId = Number(body.productId || body.product_id || 0);
  const rating = Number(body.rating || 0);
  const reviewText = sanitizeReviewText(body.review);

  if (!productId) {
    return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5.' }, { status: 400 });
  }

  if (reviewText.length < 10) {
    return NextResponse.json({ error: 'Please write at least 10 characters.' }, { status: 400 });
  }

  const [verifiedPurchase, existingReviews] = await Promise.all([
    hasVerifiedPurchase(user.id, productId),
    getProductReviews(productId),
  ]);

  const alreadyReviewed = existingReviews.some(
    (review) => review.reviewer_email?.toLowerCase() === user.email.toLowerCase(),
  );

  if (alreadyReviewed) {
    return NextResponse.json({ error: 'You have already reviewed this product.' }, { status: 409 });
  }

  const review = await createProductReview({
    product_id: productId,
    reviewer: user.name,
    reviewer_email: user.email,
    review: reviewText,
    rating,
  });

  if (!review) {
    return NextResponse.json({ error: 'Could not submit review right now.' }, { status: 500 });
  }

  return NextResponse.json({
    review,
    message: 'Thanks. Your review was submitted successfully.',
  }, { status: 201 });
}
