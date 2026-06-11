'use client';

import { useEffect, useState } from 'react';
import { Heart, LogOut, Mail, Package, Truck, User } from 'lucide-react';
import Link from 'next/link';
import { getProviders, signIn, signOut } from 'next-auth/react';
import toast from 'react-hot-toast';

interface SessionUser {
  id: number;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

interface SkinQuizAccountResult {
  headline: string;
  summary: string;
  shopHref: string;
  savedAt?: string;
  recommendedProducts?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  profile?: {
    skinType?: string;
    concerns?: string[];
    environment?: string;
    routinePace?: string;
    budget?: string;
  };
}

function formatSavedDate(value?: string) {
  if (!value) return '';

  try {
    return new Intl.DateTimeFormat('en-BD', {
      dateStyle: 'medium',
    }).format(new Date(value));
  } catch {
    return '';
  }
}

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [latestSkinQuiz, setLatestSkinQuiz] = useState<SkinQuizAccountResult | null>(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [socialProviders, setSocialProviders] = useState<Record<string, { id: string; name: string }>>({});
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [registrationNotice, setRegistrationNotice] = useState('');
  const [loginForm, setLoginForm] = useState({
    login: '',
    password: '',
  });
  const [resetLogin, setResetLogin] = useState('');
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verified = params.get('verified');
    const reason = params.get('reason');

    if (verified === '1') {
      toast.success('Email verified. You are signed in now.');
      window.history.replaceState(null, '', '/account');
    } else if (verified === '0') {
      toast.error(reason && reason !== 'failed' ? reason : 'Email verification failed. Please try logging in to resend the link.');
      window.history.replaceState(null, '', '/account');
    }

    const loadAccount = async () => {
      try {
        const providers = await getProviders().catch(() => null);
        setSocialProviders(providers ?? {});

        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        const data = await response.json().catch(() => ({}));
        if (response.ok && data?.authenticated && data?.user) {
          setUser(data.user);
          setLatestSkinQuiz(data?.skin_quiz ?? null);
        } else {
          setUser(null);
          setLatestSkinQuiz(null);
        }
      } catch {
        setUser(null);
        setLatestSkinQuiz(null);
      } finally {
        setLoading(false);
      }
    };

    loadAccount();

    const storedWishlist = localStorage.getItem('wishlist');
    if (storedWishlist) {
      try {
        const items = JSON.parse(storedWishlist);
        setWishlistCount(Array.isArray(items) ? items.length : 0);
      } catch {
        setWishlistCount(0);
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.user) {
        throw new Error(data?.error || 'Could not log in');
      }

      const meResponse = await fetch('/api/auth/me', { cache: 'no-store' });
      const meData = await meResponse.json().catch(() => ({}));

      if (meResponse.ok && meData?.authenticated && meData?.user) {
        setUser(meData.user);
        setLatestSkinQuiz(meData?.skin_quiz ?? null);
      } else {
        setUser(data.user);
        setLatestSkinQuiz(null);
      }

      toast.success('Logged in successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not log in';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setRegistrationNotice('');
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.user) {
        if (!data?.pending_verification) {
          throw new Error(data?.error || 'Could not create account');
        }
      }
      if (data?.pending_verification) {
        const message = data?.message || 'Account created. Please check your inbox and verify your email address.';
        setRegistrationNotice(message);
        setAuthMode('login');
        setForm({
          first_name: '',
          last_name: '',
          username: '',
          email: '',
          password: '',
        });
        toast.success(message);
        return;
      }
      if (data?.user) {
        setUser(data.user);
        toast.success('Account created successfully');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not create account';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResettingPassword(true);
    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: resetLogin }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Could not send reset email');
      }
      toast.success(data?.message || 'If the account exists, a reset email has been sent.');
      setShowPasswordReset(false);
      setResetLogin('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not send reset email';
      toast.error(message);
    } finally {
      setResettingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await signOut({ redirect: false });
      setUser(null);
      setLatestSkinQuiz(null);
      toast.success('Logged out');
    } catch {
      toast.error('Logout failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-sm text-gray-500">Loading account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
            <p className="mt-2 text-gray-600">Log in, create an account, and manage your orders from one place.</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            {socialProviders.google && (
              <div className="mb-6 space-y-3">
                <button
                  type="button"
                  onClick={() => signIn('google', { callbackUrl: '/account' })}
                  className="flex w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Continue with Google
                </button>
                <div className="flex items-center gap-3 pt-1">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-400">or continue with email</span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
              </div>
            )}

            <div className="mb-5 grid grid-cols-2 rounded-xl bg-gray-100 p-1 text-sm font-semibold text-gray-600">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`rounded-lg px-4 py-2 transition-colors ${authMode === 'login' ? 'bg-white text-gray-950 shadow-sm' : 'hover:text-gray-950'}`}
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`rounded-lg px-4 py-2 transition-colors ${authMode === 'register' ? 'bg-white text-gray-950 shadow-sm' : 'hover:text-gray-950'}`}
              >
                Create account
              </button>
            </div>

            {authMode === 'login' ? (
              <div className="space-y-4">
                <form onSubmit={handleLogin} className="grid grid-cols-1 gap-4">
                  <input
                    name="login"
                    value={loginForm.login}
                    onChange={handleLoginChange}
                    placeholder="Email address or username"
                    required
                    className="rounded-lg border border-gray-300 px-4 py-3 text-sm"
                  />
                  <input
                    name="password"
                    type="password"
                    value={loginForm.password}
                    onChange={handleLoginChange}
                    placeholder="Password"
                    required
                    className="rounded-lg border border-gray-300 px-4 py-3 text-sm"
                  />
                  <button type="submit" disabled={submitting} className="rounded-lg bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
                    {submitting ? 'Logging in...' : 'Log in'}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => setShowPasswordReset((current) => !current)}
                  className="text-sm font-semibold text-primary-600 hover:underline"
                >
                  Forgot your password?
                </button>

                {showPasswordReset && (
                  <form onSubmit={handlePasswordReset} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <label htmlFor="reset-login" className="mb-2 block text-sm font-semibold text-gray-700">
                      Reset password
                    </label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                      <input
                        id="reset-login"
                        value={resetLogin}
                        onChange={(event) => setResetLogin(event.target.value)}
                        placeholder="Email address or username"
                        required
                        className="rounded-lg border border-gray-300 px-4 py-3 text-sm"
                      />
                      <button type="submit" disabled={resettingPassword} className="rounded-lg border border-gray-900 px-5 py-3 text-sm font-semibold text-gray-950 hover:bg-gray-950 hover:text-white disabled:opacity-60">
                        {resettingPassword ? 'Sending...' : 'Send reset'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <form onSubmit={handleRegister} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="First name" className="rounded-lg border border-gray-300 px-4 py-3 text-sm" />
                <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Last name" className="rounded-lg border border-gray-300 px-4 py-3 text-sm" />
                <input name="username" value={form.username} onChange={handleChange} placeholder="Username" required className="rounded-lg border border-gray-300 px-4 py-3 text-sm sm:col-span-2" />
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email address" required className="rounded-lg border border-gray-300 px-4 py-3 text-sm sm:col-span-2" />
                <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password" required className="rounded-lg border border-gray-300 px-4 py-3 text-sm sm:col-span-2" />
                <button type="submit" disabled={submitting} className="sm:col-span-2 rounded-lg bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
                  {submitting ? 'Creating account...' : 'Create account'}
                </button>
              </form>
            )}

            {registrationNotice && (
              <div className="mt-5 rounded-xl border border-primary-100 bg-primary-50 p-4 text-sm font-medium text-gray-700">
                {registrationNotice}
              </div>
            )}

            <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
              After email verification, you can view your orders at <Link href="/account/orders" className="font-semibold text-primary-600 hover:underline">Order History</Link>.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Customer';

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <p className="mt-2 text-gray-600">Manage your account and view your orders.</p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{displayName}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
              </div>
              <nav className="space-y-1 p-4">
                <Link href="/account/orders" className="flex items-center rounded-md px-4 py-3 text-gray-700 transition-colors hover:bg-gray-50 group">
                  <Package className="mr-3 h-5 w-5 text-gray-400 group-hover:text-primary-600" />
                  <span className="font-medium">Order History</span>
                </Link>
                <Link href="/wishlist" className="flex items-center rounded-md px-4 py-3 text-gray-700 transition-colors hover:bg-gray-50 group">
                  <Heart className="mr-3 h-5 w-5 text-gray-400 group-hover:text-primary-600" />
                  <span className="font-medium">Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="ml-auto rounded-full bg-primary-100 px-2 py-1 text-xs font-bold text-primary-600">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
                <Link href="/track-order" className="flex items-center rounded-md px-4 py-3 text-gray-700 transition-colors hover:bg-gray-50 group">
                  <Truck className="mr-3 h-5 w-5 text-gray-400 group-hover:text-primary-600" />
                  <span className="font-medium">Track Order</span>
                </Link>
                <button onClick={handleLogout} className="flex w-full items-center rounded-md px-4 py-3 text-gray-700 transition-colors hover:bg-gray-50 group">
                  <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-primary-600" />
                  <span className="font-medium">Logout</span>
                </button>
              </nav>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-semibold text-gray-900">Dashboard Overview</h2>
              <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-600">Saved Email</h3>
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="break-all text-base font-bold text-gray-900">{user.email}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-600">Wishlist Items</h3>
                    <Heart className="h-5 w-5 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{wishlistCount}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Orders</h3>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">Your live order history is available on the dedicated orders page.</p>
                  <Link href="/account/orders" className="mt-4 inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                    View Orders
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Quick Actions</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Link href="/skin-quiz" className="flex items-center rounded-lg border border-gray-200 p-4 transition-colors hover:border-primary-600 hover:bg-primary-50">
                  <Mail className="mr-3 h-6 w-6 text-primary-600" />
                  <div>
                    <p className="font-medium text-gray-900">Skin Routine Quiz</p>
                    <p className="text-sm text-gray-500">Get a routine by email</p>
                  </div>
                </Link>
                <Link href="/shop" className="flex items-center rounded-lg border border-gray-200 p-4 transition-colors hover:border-primary-600 hover:bg-primary-50">
                  <Package className="mr-3 h-6 w-6 text-primary-600" />
                  <div>
                    <p className="font-medium text-gray-900">Browse Products</p>
                    <p className="text-sm text-gray-500">Explore latest arrivals</p>
                  </div>
                </Link>
                <Link href="/track-order" className="flex items-center rounded-lg border border-gray-200 p-4 transition-colors hover:border-primary-600 hover:bg-primary-50">
                  <Truck className="mr-3 h-6 w-6 text-primary-600" />
                  <div>
                    <p className="font-medium text-gray-900">Track Order</p>
                    <p className="text-sm text-gray-500">Check delivery status</p>
                  </div>
                </Link>
                <Link href="/account/orders" className="flex items-center rounded-lg border border-gray-200 p-4 transition-colors hover:border-primary-600 hover:bg-primary-50">
                  <Package className="mr-3 h-6 w-6 text-primary-600" />
                  <div>
                    <p className="font-medium text-gray-900">Order History</p>
                    <p className="text-sm text-gray-500">View order history</p>
                  </div>
                </Link>
                <Link href="/wishlist" className="flex items-center rounded-lg border border-gray-200 p-4 transition-colors hover:border-primary-600 hover:bg-primary-50">
                  <Heart className="mr-3 h-6 w-6 text-primary-600" />
                  <div>
                    <p className="font-medium text-gray-900">My Wishlist</p>
                    <p className="text-sm text-gray-500">View saved items</p>
                  </div>
                </Link>
              </div>
            </div>

            <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Skin Routine</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Use the same email here and in the quiz to keep your routine in one place.
                  </p>
                </div>
                <Link href="/skin-quiz" className="text-sm font-semibold text-primary-600 hover:underline">
                  {latestSkinQuiz ? 'Retake quiz' : 'Take quiz'}
                </Link>
              </div>

              {latestSkinQuiz ? (
                <div className="mt-5 space-y-5">
                  <div className="rounded-xl border border-primary-100 bg-primary-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                      Latest saved routine
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-gray-900">{latestSkinQuiz.headline}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{latestSkinQuiz.summary}</p>
                    {formatSavedDate(latestSkinQuiz.savedAt) && (
                      <p className="mt-3 text-xs font-medium text-gray-500">
                        Saved on {formatSavedDate(latestSkinQuiz.savedAt)}
                      </p>
                    )}
                  </div>

                  {latestSkinQuiz.profile && (
                    <div className="flex flex-wrap gap-2">
                      {latestSkinQuiz.profile.skinType && (
                        <span className="rounded-full bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700">
                          {latestSkinQuiz.profile.skinType}
                        </span>
                      )}
                      {(latestSkinQuiz.profile.concerns || []).slice(0, 3).map((concern) => (
                        <span key={concern} className="rounded-full bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700">
                          {concern}
                        </span>
                      ))}
                      {latestSkinQuiz.profile.environment && (
                        <span className="rounded-full bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700">
                          {latestSkinQuiz.profile.environment}
                        </span>
                      )}
                    </div>
                  )}

                  {latestSkinQuiz.recommendedProducts && latestSkinQuiz.recommendedProducts.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Recommended picks</h3>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {latestSkinQuiz.recommendedProducts.slice(0, 4).map((product) => (
                          <Link
                            key={product.id}
                            href={`/shop/${product.slug}`}
                            className="rounded-lg border border-gray-200 px-4 py-3 transition-colors hover:border-primary-300 hover:bg-primary-50"
                          >
                            <p className="text-sm font-semibold text-gray-900">{product.name}</p>
                            <p className="mt-1 text-xs text-gray-500">Open product</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <Link href={latestSkinQuiz.shopHref || '/shop'} className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                      Shop this routine
                    </Link>
                    <Link href="/skin-quiz" className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                      Update my routine
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5">
                  <p className="text-sm leading-6 text-gray-600">
                    No routine saved yet. Take the Emart skin quiz and we will email the plan first. If this email already matches your Emart account, the latest routine will also show up here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
