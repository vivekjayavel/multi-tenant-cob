import { useState } from 'react';
import { useRouter } from 'next/router';
import { m as motion } from 'framer-motion';
import MetaTags from '../components/seo/MetaTags';
const { noindexSeo }           = require('../lib/seo');
const { getTenantFromRequest } = require('../lib/prefetch');
import api from '../lib/api';

const REASON_MESSAGES = {
  unauthenticated: 'Please sign in to access the admin panel.',
  expired:         'Your session has expired. Please sign in again.',
  unauthorized:    'You do not have permission to access that page.',
  invalid:         'Your session is invalid. Please sign in again.',
  revoked:         'Your session was ended remotely. Please sign in again.',
  logged_out_all:  'You have been signed out from all devices successfully.',
};

export default function LoginPage({ tenant }) {
  const router = useRouter();
  const reason = router.query.reason;
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);
  const seo = noindexSeo(tenant, 'Login');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      localStorage.setItem('token', data.token);
      router.push(data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MetaTags seo={seo} tenant={tenant} />
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Brand: logo + name */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              {tenant?.logo_url && (
                <img
                  src={tenant.logo_url}
                  alt={tenant?.name}
                  className="h-12 w-auto object-contain max-w-[48px]"
                />
              )}
              <p className="font-display text-2xl font-bold" style={{ color: 'var(--tenant-primary)' }}>
                {tenant?.name}
              </p>
            </div>
            <p className="text-gray-500 text-sm">Sign in to your account</p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">

            {/* Reason message */}
            {reason && REASON_MESSAGES[reason] && !error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-sm rounded-xl px-4 py-3 mb-5 border ${
                  ['expired','unauthenticated','logged_out_all'].includes(reason)
                    ? 'bg-amber-50 border-amber-100 text-amber-700'
                    : 'bg-red-50 border-red-100 text-red-600'
                }`}
              >
                {REASON_MESSAGES[reason]}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                  className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3"
                >
                  {error}
                </motion.p>
              )}

              {/* Email field — id + htmlFor fixes accessibility warnings */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide"
                >
                  Email address
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-all placeholder-gray-300"
                  style={{ '--tw-ring-color': 'color-mix(in srgb, var(--tenant-primary) 30%, transparent)' }}
                />
              </div>

              {/* Password field — id + htmlFor fixes accessibility warnings */}
              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide"
                >
                  Password
                </label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-all placeholder-gray-300"
                  style={{ '--tw-ring-color': 'color-mix(in srgb, var(--tenant-primary) 30%, transparent)' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-semibold py-3.5 rounded-xl transition-all duration-200 mt-2 disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-lg"
                style={{ backgroundColor: 'var(--tenant-primary)' }}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export async function getServerSideProps({ req }) {
  const tenant = await getTenantFromRequest(req);
  if (!tenant) return { notFound: true };
  return { props: { tenant } };
}
