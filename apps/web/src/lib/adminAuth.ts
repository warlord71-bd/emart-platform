import { timingSafeEqual } from 'crypto';
import { NextRequest } from 'next/server';

/**
 * Constant-time string compare. Pads to equal length first so length
 * differences don't short-circuit before timingSafeEqual is reached.
 */
export function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * Admin dashboard auth: x-admin-token header against ADMIN_API_TOKEN.
 * Header-only — no ?token= query param (avoids leaking the token in
 * server logs / browser history).
 */
export function isAdminAuthorized(req: NextRequest): boolean {
  const expected = process.env.ADMIN_API_TOKEN;
  if (!expected) return false;
  const provided = req.headers.get('x-admin-token') || '';
  if (!provided) return false;
  return timingSafeEqualStr(provided, expected);
}
