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

export async function ensureCustomerByEmail(params: {
  email: string;
  firstName?: string;
  lastName?: string;
}): Promise<WooCustomer> {
  const normalizedEmail = params.email.trim().toLowerCase();
  const existingCustomer = await getCustomerByEmail(normalizedEmail);
  if (existingCustomer) {
    return existingCustomer;
  }

  const fullName = [params.firstName, params.lastName].filter(Boolean).join(' ').trim();
  const { firstName, lastName } = splitName(fullName);
  const baseUsername = makeBaseUsername(normalizedEmail, fullName);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = attempt === 0 ? '' : randomBytes(2).toString('hex');
    const username = `${baseUsername}${suffix}`.slice(0, 28);
    const password = randomBytes(24).toString('hex');
    const createdCustomer = await createCustomer({
      email: normalizedEmail,
      username,
      password,
      first_name: firstName,
      last_name: lastName,
    });

    if (createdCustomer) {
      return createdCustomer;
    }

    const retriedCustomer = await getCustomerByEmail(normalizedEmail);
    if (retriedCustomer) {
      return retriedCustomer;
    }
  }

  throw new Error('Could not create or load checkout customer');
}
