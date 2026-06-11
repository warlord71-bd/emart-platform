/**
 * Maps a checkout-flow error to a customer-safe message + HTTP status.
 * Full error details (raw message, status, response data) must still be
 * logged server-side by the caller — this only controls what the client sees.
 */

const GENERIC_MESSAGE = 'Checkout failed. Please try again or contact support.';
const UNAVAILABLE_MESSAGE = 'Checkout is temporarily unavailable. Please try again in a moment.';
const INVALID_REQUEST_MESSAGE = 'We could not process your order with the details provided. Please check your information and try again.';

// Patterns that are already written to be customer-facing (stock + coupon
// messages from WooCommerce/the order-creation plugin) and safe to pass
// through verbatim.
const SAFE_MESSAGE_PATTERNS = [/stock/i, /coupon/i];

function extractRawMessage(error: unknown): string {
  const data = (error as { response?: { data?: { error?: unknown; message?: unknown } } })?.response?.data;
  if (typeof data?.error === 'string' && data.error) return data.error;
  if (typeof data?.message === 'string' && data.message) return data.message;
  const message = (error as { message?: unknown })?.message;
  return typeof message === 'string' ? message : '';
}

export function getCheckoutErrorResponse(error: unknown): { message: string; status: number } {
  const status = (error as { response?: { status?: number }; status?: number })?.response?.status
    ?? (error as { status?: number })?.status
    ?? 500;

  const rawMessage = extractRawMessage(error);

  if (rawMessage && SAFE_MESSAGE_PATTERNS.some((pattern) => pattern.test(rawMessage))) {
    return { message: rawMessage, status };
  }

  if (status === 503) {
    return { message: UNAVAILABLE_MESSAGE, status };
  }

  if (status >= 400 && status < 500) {
    return { message: INVALID_REQUEST_MESSAGE, status };
  }

  return { message: GENERIC_MESSAGE, status: status >= 500 ? status : 500 };
}
