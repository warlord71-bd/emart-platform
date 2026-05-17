/**
 * Packzy Courier API client.
 *
 * Auth: static API Key + Secret Key in request headers (no token rotation needed).
 * Base URL: https://portal.packzy.com/api/v1
 */

const BASE_URL = 'https://portal.packzy.com/api/v1';
const API_KEY = process.env.PACKZY_API_KEY || '';
const SECRET_KEY = process.env.PACKZY_SECRET_KEY || '';

export interface PackzyOrderPayload {
  invoice: string;            // unique merchant order ID
  recipient_name: string;
  recipient_phone: string;    // 11 digits
  recipient_address: string;  // max 250 chars
  cod_amount: number;         // 0 for prepaid, order total for COD
  note?: string;
}

export interface PackzyOrderResponse {
  consignment_id: number;
  invoice: string;
  tracking_code: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  status: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

function headers() {
  return {
    'Api-Key': API_KEY,
    'Secret-Key': SECRET_KEY,
    'Content-Type': 'application/json',
  };
}

async function packzyPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  if (!API_KEY || !SECRET_KEY) {
    throw new Error('Packzy credentials not configured (check PACKZY_API_KEY / PACKZY_SECRET_KEY)');
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || (json as any)?.status >= 400) {
    const msg = (json as any)?.message || (json as any)?.error || `HTTP ${res.status}`;
    throw new Error(`Packzy API error (${path}): ${msg}`);
  }

  return json as T;
}

async function packzyGet<T>(path: string): Promise<T> {
  if (!API_KEY || !SECRET_KEY) {
    throw new Error('Packzy credentials not configured');
  }
  const res = await fetch(`${BASE_URL}${path}`, { headers: headers() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Packzy API error (${path}): ${(json as any)?.message || `HTTP ${res.status}`}`);
  }
  return json as T;
}

export async function createPackzyOrder(payload: PackzyOrderPayload): Promise<PackzyOrderResponse> {
  const data = await packzyPost<{ status: number; message: string; consignment: PackzyOrderResponse }>(
    '/create_order',
    payload as unknown as Record<string, unknown>,
  );

  if (!data?.consignment?.tracking_code) {
    throw new Error(`Packzy order creation failed: ${data?.message || 'no tracking_code returned'}`);
  }

  return data.consignment;
}

export async function getPackzyBalance(): Promise<{ current_balance: number }> {
  return packzyGet<{ current_balance: number }>('/get_balance');
}

export async function trackPackzyOrder(consignmentId: string): Promise<unknown> {
  return packzyGet(`/status_by_cid/${consignmentId}`);
}
