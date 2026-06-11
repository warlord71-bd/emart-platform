/**
 * POST /api/admin/auth
 * Validates admin username + password and returns the internal access token.
 * Credentials set via ADMIN_USERNAME / ADMIN_PASSWORD in .env.local.
 * The returned token (ADMIN_API_TOKEN) is separate from REVALIDATE_SECRET
 * so it can be scoped/rotated independently of the revalidation flow.
 */
import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqualStr } from '@/lib/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const adminUser = process.env.ADMIN_USERNAME || '';
  const adminPass = process.env.ADMIN_PASSWORD || '';
  const adminToken = process.env.ADMIN_API_TOKEN || '';

  if (!adminUser || !adminPass || !adminToken) {
    return NextResponse.json({ error: 'Admin credentials not configured' }, { status: 500 });
  }

  const username = body.username || '';
  const password = body.password || '';

  if (!timingSafeEqualStr(username, adminUser) || !timingSafeEqualStr(password, adminPass)) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  return NextResponse.json({ token: adminToken });
}
