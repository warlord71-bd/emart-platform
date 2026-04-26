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

  if (!productId) {
    return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
  }

  const [reviews, user] = await Promise.all([
    getProductReviews(productId),
    getCurrentReviewUser(),
  ]);

  const verifiedPurchase = user ? await hasVerifiedPurchase(user.id, productId) : false;
  const alreadyReviewed = user
    ? reviews.some((review) => review.reviewer_email?.toLowerCase() === user.email.toLowerCase())
    : false;

  return NextResponse.json({
    reviews,
    authenticated: Boolean(user),
    verifiedPurchase,
    alreadyReviewed,
    canReview: Boolean(user && verifiedPurchase && !alreadyReviewed),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentReviewUser();

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

  if (!verifiedPurchase) {
    return NextResponse.json(
      { error: 'Only verified customers who bought this product can leave a review.' },
      { status: 403 },
    );
  }

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
