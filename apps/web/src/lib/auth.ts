import { randomBytes } from 'crypto';
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
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

async function ensureWooCustomer(params: { email: string; name?: string | null }) {
  const existingCustomer = await getCustomerByEmail(params.email);
  if (existingCustomer) {
    return existingCustomer;
  }

  const { firstName, lastName } = splitName(params.name);
  const baseUsername = makeBaseUsername(params.email, params.name);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = attempt === 0 ? '' : randomBytes(2).toString('hex');
    const username = `${baseUsername}${suffix}`.slice(0, 28);
    const password = randomBytes(24).toString('hex');
    const createdCustomer = await createCustomer({
      email: params.email,
      username,
      password,
      first_name: firstName,
      last_name: lastName,
    });

    if (createdCustomer) {
      return createdCustomer;
    }

    const retriedCustomer = await getCustomerByEmail(params.email);
    if (retriedCustomer) {
      return retriedCustomer;
    }
  }

  throw new Error('Could not create or load social customer');
}

function customerDisplayName(customer: WooCustomer) {
  return `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.username || customer.email;
}

const providers = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || process.env.REVALIDATE_SECRET,
  providers,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/account',
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        return false;
      }

      try {
        const customer = await ensureWooCustomer({
          email: user.email,
          name: user.name,
        });
        (user as typeof user & { customer?: WooCustomer }).customer = customer;
        return true;
      } catch (error) {
        console.error('Social sign-in failed:', error);
        return false;
      }
    },
    async jwt({ token, user }) {
      const customer = (user as typeof user & { customer?: WooCustomer } | undefined)?.customer;
      if (customer) {
        (token as typeof token & { customer?: WooCustomer }).customer = customer;
        token.sub = String(customer.id);
        token.email = customer.email;
        token.name = customerDisplayName(customer);
      }
      return token;
    },
    async session({ session, token }) {
      const customer = (token as typeof token & { customer?: WooCustomer }).customer;
      if (customer && session.user) {
        (session.user as typeof session.user & {
          id?: number;
          username?: string;
          first_name?: string;
          last_name?: string;
        }).id = customer.id;
        (session.user as typeof session.user & { username?: string }).username = customer.username;
        (session.user as typeof session.user & { first_name?: string }).first_name = customer.first_name;
        (session.user as typeof session.user & { last_name?: string }).last_name = customer.last_name;
        session.user.email = customer.email;
        session.user.name = customerDisplayName(customer);
      }
      return session;
    },
  },
};
