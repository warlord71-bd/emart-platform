/**
 * POST /api/admin/auth
 * Validates admin username + password and returns the internal access token.
 * Credentials set via ADMIN_USERNAME / ADMIN_PASSWORD in .env.local
 */
import { NextRequest, NextResponse } from 'next/server';

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
  const secret = process.env.REVALIDATE_SECRET || '';

  if (!adminUser || !adminPass || !secret) {
    return NextResponse.json({ error: 'Admin credentials not configured' }, { status: 500 });
  }

  if (body.username !== adminUser || body.password !== adminPass) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  return NextResponse.json({ token: secret });
}
