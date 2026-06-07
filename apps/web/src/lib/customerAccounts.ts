import { randomBytes } from 'crypto';
import { createCustomer, getCustomerByEmail, type WooCustomer } from '@/lib/woocommerce';

function splitName(name?: string | null) {
  const fullName = (name || '').trim();
  if (!fullName) {
    return { firstName: '', lastName: '' };
  }

  const parts = fullName.split(/\s+/);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
}

function makeBaseUsername(email: string, name?: string | null) {
  const fromEmail = email.split('@')[0] || '';
  const fromName = (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  const base = (fromName || fromEmail.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'emartuser').slice(0, 20);
  return base || 'emartuser';
}

export interface EnsureCustomerResult {
  customer: WooCustomer;
  isNew: boolean;
}

export async function ensureCustomerByEmail(params: {
  email: string;
  firstName?: string;
  lastName?: string;
}): Promise<EnsureCustomerResult> {
  const normalizedEmail = params.email.trim().toLowerCase();
  const existingCustomer = await getCustomerByEmail(normalizedEmail);
  if (existingCustomer) {
    return { customer: existingCustomer, isNew: false };
  }

  const fullName = [params.firstName, params.lastName].filter(Boolean).join(' ').trim();
  const { firstName, lastName } = splitName(fullName);
  const baseUsername = makeBaseUsername(normalizedEmail, fullName);

  const password = randomBytes(24).toString('hex');
  const createdCustomer = await createCustomer({
    email: normalizedEmail,
    username: baseUsername.slice(0, 28),
    password,
    first_name: firstName,
    last_name: lastName,
  }, { quietExistingEmail: true });

  if (createdCustomer) {
    return { customer: createdCustomer, isNew: true };
  }

  const retriedCustomer = await getCustomerByEmail(normalizedEmail);
  if (retriedCustomer) {
    // Found on retry = race condition, another request created it
    return { customer: retriedCustomer, isNew: false };
  }

  // Do not block checkout only because the email belongs to an existing
  // WordPress account that Woo REST cannot expose as a customer. The secure
  // order endpoint resolves billing email to a WP user before order creation.
  return {
    customer: {
      id: 0,
      email: normalizedEmail,
      first_name: firstName,
      last_name: lastName,
      username: baseUsername,
      avatar_url: '',
    },
    isNew: false,
  };
}
