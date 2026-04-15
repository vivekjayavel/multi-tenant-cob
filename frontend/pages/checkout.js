import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';
import MetaTags from '../components/seo/MetaTags';
import { useCart } from '../context/CartContext';
const { noindexSeo }           = require('../lib/seo');
const { getTenantFromRequest } = require('../lib/prefetch');
import api from '../lib/api';

export default function CheckoutPage({ tenant }) {
  const router           = useRouter();
  const { items, total, dispatch, hydrated } = useCart();
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [form,    setForm]    = useState({ name: '', phone: '', address: '', city: '', pincode: '', notes: '' });
  const seo = noindexSeo(tenant, 'Checkout');
  const field = (key) => ({ value: form[key], onChange: (e) => setForm(f => ({ ...f, [key]: e.target.value })) });

  const handlePlaceOrder = async (e) => {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      const address = [form.name + ', ' + form.phone, form.address + ', ' + form.city + ' - ' + form.pincode].join('\n');
      const { data } = await api.post('/orders', { items: items.map(i => ({ product_id: i.id, quantity: i.quantity })), delivery_address: address, notes: form.notes || undefined });
      setOrderId(data.orderId); setStep(2);
    } catch (err) { setError(err?.response?.data?.message || 'Could not place order. Please try again.'); }
    finally { setLoading(false); }
  };

  const handlePayment = async () => {
    setError(null); setLoading(true);
    try {
      const { data } = await api.post('/payment/create-order', { orderId });
      const options  = {
        key: data.key_id, amount: data.amount, currency: data.currency,
        name: tenant.name, description: `Order #${orderId}`, image: tenant.logo_url, order_id: data.razorpay_order_id,
        prefill: { name: form.name, contact: form.phone },
        theme: { color: tenant.theme_color || '#D97706' },
        handler: async (response) => {
          try {
            await api.post('/payment/verify', { razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature, orderId });
            dispatch({ type: 'CLEAR' }); setStep(3);
          } catch { setError('Payment verification failed. Contact support with payment ID: ' + response.razorpay_payment_id); }
        },
        modal: { ondismiss: () => setLoading(false) },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (r) => { setError(`Payment failed: ${r.error.description}`); setLoading(false); });
      rzp.open();
    } catch (err) { setError(err?.response?.data?.message || 'Payment initialisation failed.'); setLoading(false); }
  };

  // Only show empty cart screen after client hydration
  // Before hydration, render nothing to avoid SSR/CSR mismatch
  if (!hydrated) return null;
  if (items.length === 0 && step !== 3) return (
    <Layout tenant={tenant}>
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 pt-20">
        <span className="text-6xl">🛒</span>
        <p className="text-gray-500 text-lg">Your cart is empty.</p>
        <a href="/products" className="text-white font-semibold px-6 py-3 rounded-xl" style={{ backgroundColor: 'var(--tenant-primary)' }}>Browse Menu</a>
      </div>
    </Layout>
  );

  return (
    <>
      <MetaTags seo={seo} tenant={tenant} />
      <Head>
        {/* Razorpay only loaded on checkout page */}
        <script src="https://checkout.razorpay.com/v1/checkout.js" />
      </Head>
      <Layout tenant={tenant}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-20">
          {step < 3 && (
            <div className="flex items-center justify-center gap-3 mb-12">
              {[{ n: 1, label: 'Delivery' }, { n: 2, label: 'Payment' }].map(({ n, label }, i) => (
                <div key={n} className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300 ${step >= n ? 'text-white' : 'bg-gray-100 text-gray-400'}`} style={step >= n ? { backgroundColor: 'var(--tenant-primary)' } : {}}>
                      {step > n ? '✓' : n}
                    </div>
                    <span className={`text-sm font-medium hidden sm:block ${step >= n ? 'text-gray-800' : 'text-gray-400'}`}>{label}</span>
                  </div>
                  {i < 1 && <div className={`w-16 h-0.5 ${step > n ? 'bg-amber-400' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>
          )}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="grid lg:grid-cols-[1fr_380px] gap-10">
                <div>
                  <h1 className="font-display text-2xl text-gray-900 mb-6">Delivery details</h1>
                  <form onSubmit={handlePlaceOrder} className="space-y-4">
                    {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Full name"    type="text" required placeholder="Priya Sharma"   {...field('name')} />
                      <Field label="Phone number" type="tel"  required placeholder="98765 43210"    {...field('phone')} />
                    </div>
                    <Field label="Street address" type="text" required placeholder="12, Rose Garden St" {...field('address')} />
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="City"    type="text" required placeholder="Chennai" {...field('city')} />
                      <Field label="Pincode" type="text" required placeholder="600001" pattern="\d{6}" {...field('pincode')} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Notes (optional)</label>
                      <textarea rows={3} placeholder="Special instructions…" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 transition-all placeholder-gray-300" {...field('notes')} />
                    </div>
                    <button type="submit" disabled={loading} className="w-full text-white font-semibold py-4 rounded-xl transition-all duration-200 mt-2 disabled:opacity-60 hover:-translate-y-0.5 hover:shadow-lg" style={{ backgroundColor: 'var(--tenant-primary)' }}>
                      {loading ? 'Saving…' : 'Continue to Payment →'}
                    </button>
                  </form>
                </div>
                <OrderSummary items={items} total={total} />
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="grid lg:grid-cols-[1fr_380px] gap-10">
                <div>
                  <h1 className="font-display text-2xl text-gray-900 mb-2">Payment</h1>
                  <p className="text-sm text-gray-500 mb-8">Order <span className="font-semibold text-gray-700">#{orderId}</span> confirmed.</p>
                  {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-6">{error}</p>}
                  <button onClick={handlePayment} disabled={loading} className="w-full text-white font-semibold py-4 rounded-xl transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-lg" style={{ backgroundColor: 'var(--tenant-primary)' }}>
                    {loading ? 'Opening Razorpay…' : `Pay ₹${total.toFixed(2)} securely`}
                  </button>
                  <div className="flex items-center justify-center gap-6 mt-6">
                    {['SSL Secure', 'UPI & Cards', 'Razorpay'].map(t => (
                      <div key={t} className="flex items-center gap-1.5 text-xs text-gray-400">
                        <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>{t}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setStep(1); setError(null); }} className="mt-6 text-sm text-gray-400 hover:text-gray-600 transition-colors underline">← Edit delivery details</button>
                </div>
                <OrderSummary items={items} total={total} />
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 max-w-md mx-auto">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }} className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">🎉</motion.div>
                <h1 className="font-display text-3xl text-gray-900 mb-3">Order confirmed!</h1>
                <p className="text-gray-500 mb-2">Thank you for your order from <strong>{tenant.name}</strong>.</p>
                <p className="text-sm text-gray-400 mb-8">Order #{orderId} · We'll reach out to confirm delivery.</p>
                {tenant.whatsapp_number && (
                  <a href={`https://wa.me/${tenant.whatsapp_number}?text=${encodeURIComponent(`Hi! I just placed Order #${orderId}. Please confirm the delivery time.`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#25D366] text-white font-semibold px-6 py-3 rounded-xl mb-4 hover:bg-[#1ebe5d] transition-colors">Confirm via WhatsApp</a>
                )}
                <div><a href="/" className="block text-sm text-gray-400 hover:text-gray-600 transition-colors underline">Back to home</a></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Layout>
    </>
  );
}

function Field({ label, id, ...props }) {
  const fieldId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div>
      <label htmlFor={fieldId} className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{label}</label>
      <input id={fieldId} name={fieldId} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-all placeholder-gray-300" {...props} />
    </div>
  );
}

function OrderSummary({ items, total }) {
  return (
    <div className="bg-stone-50 rounded-2xl p-6 h-fit border border-gray-100">
      <h2 className="font-display text-lg text-gray-800 mb-4">Order summary</h2>
      <div className="space-y-3 mb-4">
        {items.map(item => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-gray-600 flex-1 pr-2 truncate">{item.name} <span className="text-gray-400">×{item.quantity}</span></span>
            <span className="font-medium text-gray-800 flex-shrink-0">₹{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-200 pt-3 flex justify-between">
        <span className="font-semibold text-gray-800">Total</span>
        <span className="font-bold text-lg" style={{ color: 'var(--tenant-primary)' }}>₹{total.toFixed(2)}</span>
      </div>
    </div>
  );
}

export async function getServerSideProps({ req }) {
  const tenant = await getTenantFromRequest(req);
  if (!tenant) return { notFound: true };
  return { props: { tenant } };
}
