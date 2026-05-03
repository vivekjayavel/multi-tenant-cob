import { useState } from 'react';
import Head from 'next/head';
import { m as motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';
import MetaTags from '../components/seo/MetaTags';
import { useCart } from '../context/CartContext';
const { noindexSeo }           = require('../lib/seo');
const { getTenantFromRequest } = require('../lib/prefetch');
import api from '../lib/api';

const PAYMENT_METHODS = [
  { id: 'online', icon: '💳', label: 'Pay Online',        sub: 'UPI, Cards, Net Banking via Razorpay' },
  { id: 'cod',    icon: '💵', label: 'Cash on Delivery',  sub: 'Pay when your order arrives' },
];

export default function CheckoutPage({ tenant }) {
  const { items, total, dispatch, hydrated } = useCart();
  const [step,          setStep]          = useState(1);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);
  const [orderId,       setOrderId]       = useState(null);
  const [form,          setForm]          = useState({ name:'', phone:'', address:'', city:'', pincode:'', notes:'' });
  const [orderSnapshot, setOrderSnapshot] = useState(null); // captured before cart is cleared
  const seo  = noindexSeo(tenant, 'Checkout');
  const hasRazorpay = !!tenant?.razorpay_key_id;
  // Auto-select COD if Razorpay not configured
  const [paymentMethod, setPaymentMethod] = useState(!tenant?.razorpay_key_id ? 'cod' : 'online');
  const field = key => ({ value: form[key], onChange: e => setForm(f => ({ ...f, [key]: e.target.value })) });

  // Build WhatsApp message — reads from snapshot (captured before cart clear)
  const buildWhatsAppMessage = (oId) => {
    const snap = orderSnapshot;
    if (!snap || !snap.items || !snap.items.length) {
      return encodeURIComponent(`Hi! I placed Order #${oId} at ${tenant?.name || 'your store'}. Please confirm.`);
    }
    const pmLabel  = snap.paymentMethod === 'cod' ? 'Cash on Delivery 💵' : 'Online Payment 💳';
    const itemLines = snap.items.map(i => {
      const subtotal = (i.price * i.quantity).toFixed(2);
      let line = `• *${i.name}* × ${i.quantity}  ₹${subtotal}`;
      if (i.customization) {
        const cust = Object.entries(i.customization).filter(([,v]) => v);
        if (cust.length) {
          line += '\n' + cust.map(([k,v]) => {
            const label = k === 'weight' ? String(v).split('|')[0] : v;
            const keyLabel = k === 'eggless_charge' ? 'Eggless charge' : k === 'egg' ? 'Egg preference' : k;
            return `   \u203a ${keyLabel}: ${label}`;
          }).join('\n');
        }
      }
      if (i.eggless_surcharge > 0) {
        line += `\n   \u203a Eggless charge: +₹${i.eggless_surcharge}`;
      }
      return line;
    }).join('\n');

    const msg = [
      `🛒 *New Order #${oId}*`,
      `🏪 ${tenant?.name || 'Order'}`,
      ``,
      `📍 *Payment:* ${pmLabel}`,
      ``,
      `🧁 *Items:*`,
      itemLines,
      ``,
      `💰 *Order Total: ₹${snap.total.toFixed(2)}*`,
      ``,
      `📦 *Deliver to:*`,
      `👤 ${snap.form.name}`,
      `📞 ${snap.form.phone}`,
      `🏠 ${snap.form.address}`,
      `    ${snap.form.city} — ${snap.form.pincode}`,
      snap.form.notes ? `\n📝 *Notes:* ${snap.form.notes}` : '',
    ].filter(l => l !== undefined).join('\n');

    return encodeURIComponent(msg);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      const address = `${form.name}, ${form.phone}\n${form.address}, ${form.city} - ${form.pincode}`;
      const { data } = await api.post('/orders', {
        items: items.map(i => ({
          product_id:    i.id,
          quantity:      i.quantity,
          customization: i.customization || undefined,
        })),
        delivery_address: address,
        notes:            form.notes || undefined,
        payment_method:   paymentMethod,
      });
      setOrderId(data.orderId);

      if (paymentMethod === 'cod') {
        // Capture snapshot BEFORE clearing cart so WhatsApp message has all details
        setOrderSnapshot({ items: [...items], total, form: { ...form }, paymentMethod: 'cod' });
        dispatch({ type: 'CLEAR' });
        setStep(3);
      } else {
        setStep(2);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not place order. Please try again.');
    } finally { setLoading(false); }
  };

  const handleOnlinePayment = async () => {
    setError(null); setLoading(true);
    try {
      const { data } = await api.post('/payment/create-order', { orderId });
      const options  = {
        key:         data.key_id,
        amount:      data.amount,
        currency:    data.currency,
        name:        tenant.name,
        description: `Order #${orderId}`,
        image:       tenant.logo_url,
        order_id:    data.razorpay_order_id,
        prefill:     { name: form.name, contact: form.phone },
        theme:       { color: tenant.theme_color || '#D97706' },
        handler: async (response) => {
          try {
            await api.post('/payment/verify', {
              razorpay_order_id:  response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              orderId,
            });
            setOrderSnapshot({ items: [...items], total, form: { ...form }, paymentMethod: 'online' });
            dispatch({ type: 'CLEAR' });
            setStep(3);
          } catch {
            setError('Payment verification failed. Contact support with payment ID: ' + response.razorpay_payment_id);
          }
        },
        modal:  { ondismiss: () => setLoading(false) },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', r => { setError(`Payment failed: ${r.error.description}`); setLoading(false); });
      rzp.open();
    } catch (err) {
      setError(err?.response?.data?.message || 'Payment initialisation failed.');
      setLoading(false);
    }
  };

  if (!hydrated) return (
    <Layout tenant={tenant} hideFooter>
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--tenant-primary)' }} />
      </div>
    </Layout>
  );

  if (items.length === 0 && step !== 3) return (
    <Layout tenant={tenant} hideFooter>
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 pt-20">
        <span className="text-6xl">🛒</span>
        <p className="text-gray-500 text-lg">Your cart is empty.</p>
        <a href="/products" className="text-white font-semibold px-6 py-3 rounded-xl"
          style={{ backgroundColor: 'var(--tenant-primary)' }}>Browse Menu</a>
      </div>
    </Layout>
  );

  return (
    <>
      <MetaTags seo={seo} tenant={tenant} />
      {paymentMethod === 'online' && <Head><script src="https://checkout.razorpay.com/v1/checkout.js" /></Head>}
      <Layout tenant={tenant} hideFooter>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-36 pb-20">

          {/* Step indicators */}
          {step < 3 && (
            <div className="flex items-center justify-center gap-3 mb-10">
              {[{n:1,label:'Details'},{n:2,label:'Payment'}].map(({n,label},i) => (
                <div key={n} className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= n ? 'text-white' : 'bg-gray-100 text-gray-400'}`}
                      style={step >= n ? { backgroundColor:'var(--tenant-primary)' } : {}}>
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
            {/* ── Step 1: Delivery details ── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }}
                className="grid lg:grid-cols-[1fr_380px] gap-10">
                <div>
                  <h1 className="font-display text-lg sm:text-xl lg:text-2xl text-gray-900 mb-6">Delivery details</h1>
                  <form onSubmit={handlePlaceOrder} className="space-y-4">
                    {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}

                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Full name"    type="text" required placeholder="Priya Sharma"   {...field('name')}  />
                      <Field label="Phone number" type="tel"  required placeholder="98765 43210"   {...field('phone')} />
                    </div>
                    <Field label="Street address"   type="text" required placeholder="12, Rose Garden St" {...field('address')} />
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="City"    type="text" required placeholder="Chennai" {...field('city')}   />
                      <Field label="Pincode" type="text" required placeholder="600001" pattern="\d{6}" {...field('pincode')} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Notes (optional)</label>
                      <textarea rows={2} placeholder="Special instructions…"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 transition-all placeholder-gray-300"
                        {...field('notes')} />
                    </div>

                    {/* Payment method selection */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Payment Method</label>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {PAYMENT_METHODS.filter(m => m.id !== 'online' || hasRazorpay).map(m => (
                          <button key={m.id} type="button" onClick={() => setPaymentMethod(m.id)}
                            className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
                              paymentMethod === m.id ? 'shadow-sm' : 'border-gray-200 hover:border-gray-300'
                            }`}
                            style={paymentMethod === m.id
                              ? { borderColor:'var(--tenant-primary)', backgroundColor:'color-mix(in srgb, var(--tenant-primary) 5%, white)' }
                              : {}}>
                            <span className="text-lg sm:text-xl lg:text-2xl flex-shrink-0 mt-0.5">{m.icon}</span>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{m.label}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{m.sub}</p>
                            </div>
                            {paymentMethod === m.id && (
                              <div className="ml-auto flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-1"
                                style={{ backgroundColor:'var(--tenant-primary)' }}>
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                                  <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                            )}
                          </button>
                        ))}
                        {!hasRazorpay && (
                          <div className="col-span-2 flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                            <span className="text-xl flex-shrink-0">💵</span>
                            <div>
                              <p className="text-sm font-semibold text-blue-800">Cash on Delivery available</p>
                              <p className="text-xs text-blue-600 mt-0.5">Online payment is not set up for this store yet. You can pay cash when your order is delivered.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* WhatsApp notice for COD */}
                    {paymentMethod === 'cod' && tenant?.whatsapp_number && (
                      <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
                        className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        <p className="text-sm text-green-800">
                          After placing your order, your order details will be shared via WhatsApp for confirmation.
                        </p>
                      </motion.div>
                    )}

                    <button type="submit" disabled={loading}
                      className="w-full text-white font-semibold py-4 rounded-xl transition-all duration-200 disabled:opacity-60 hover:-translate-y-0.5 hover:shadow-lg"
                      style={{ backgroundColor:'var(--tenant-primary)' }}>
                      {loading ? 'Placing order…' : paymentMethod === 'cod' ? 'Place Order (COD)' : 'Continue to Payment →'}
                    </button>
                  </form>
                </div>
                <OrderSummary items={items} total={total} />
              </motion.div>
            )}

            {/* ── Step 2: Online payment ── */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }}
                className="grid lg:grid-cols-[1fr_380px] gap-10">
                <div>
                  <h1 className="font-display text-lg sm:text-xl lg:text-2xl text-gray-900 mb-2">Payment</h1>
                  <p className="text-sm text-gray-500 mb-8">Order <span className="font-semibold text-gray-700">#{orderId}</span> confirmed.</p>
                  {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-6">{error}</p>}
                  <motion.button onClick={handleOnlinePayment} disabled={loading}
                    className="w-full text-white font-semibold py-4 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-lg"
                    style={{ backgroundColor:'var(--tenant-primary)' }}
                    whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}>
                    {loading ? 'Opening Razorpay…' : `Pay ₹${total.toFixed(2)} securely`}
                  </motion.button>
                  <div className="flex items-center justify-center gap-6 mt-4">
                    {['SSL Secure','UPI & Cards','Razorpay'].map(t => (
                      <div key={t} className="flex items-center gap-1.5 text-xs text-gray-400">
                        <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                        </svg>{t}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setStep(1); setError(null); }}
                    className="mt-5 text-sm text-gray-400 hover:text-gray-600 transition-colors underline">← Edit delivery details</button>
                </div>
                <OrderSummary items={items} total={total} />
              </motion.div>
            )}

            {/* ── Step 3: Confirmation ── */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }}
                className="text-center py-16 max-w-md mx-auto">
                <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
                  transition={{ type:'spring', stiffness:260, damping:20, delay:0.2 }}
                  className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-lg sm:text-xl lg:text-2xl sm:text-3xl lg:text-4xl mx-auto mb-6">🎉</motion.div>
                <h1 className="font-display text-base sm:text-xl sm:text-2xl lg:text-3xl text-gray-900 mb-2">Order confirmed!</h1>
                <p className="text-gray-500 mb-1">Order <strong>#{orderId}</strong> placed with {tenant?.name}.</p>
                <p className="text-sm text-gray-400 mb-6">
                  {paymentMethod === 'cod'
                    ? '💵 Cash on Delivery — please keep the exact amount ready.'
                    : '✅ Payment successful.'}
                </p>

                {/* WhatsApp CTA — sends full order details */}
                {tenant?.whatsapp_number && (
                  <div className="space-y-3 mb-6">
                    <a href={`https://wa.me/${tenant.whatsapp_number}?text=${buildWhatsAppMessage(orderId)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2.5 w-full bg-[#25D366] text-white font-semibold px-6 py-4 rounded-2xl hover:bg-[#1ebe5d] transition-colors">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Send order to WhatsApp
                    </a>
                    <p className="text-xs text-gray-400">Opens WhatsApp with your full order details pre-filled</p>
                  </div>
                )}
                <a href="/" className="block text-sm text-gray-400 hover:text-gray-600 transition-colors underline">Back to home</a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Layout>
    </>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{label}</label>
      <input className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 transition-all placeholder-gray-300" {...props} />
    </div>
  );
}

function OrderSummary({ items, total }) {
  return (
    <div className="bg-stone-50 rounded-2xl p-6 h-fit border border-gray-100">
      <h2 className="font-display text-lg text-gray-800 mb-4">Order summary</h2>
      <div className="space-y-3 mb-4">
        {items.map((item, i) => (
          <div key={item._key || i} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 flex-1 pr-2 truncate">
                {item.name} <span className="text-gray-400">×{item.quantity}</span>
              </span>
              <span className="font-medium text-gray-800 flex-shrink-0">
                ₹{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
            {item.customization && (
              <div className="flex flex-wrap gap-1 pl-0">
                {Object.entries(item.customization).filter(([,v])=>v).map(([k,v]) => (
                  <span key={k} className="inline-flex text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full">
                    {k}: {String(v).length > 15 ? String(v).slice(0,15)+'…' : v}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="border-t border-gray-200 pt-3 flex justify-between">
        <span className="font-semibold text-gray-800">Total</span>
        <span className="font-bold text-lg" style={{ color:'var(--tenant-primary)' }}>₹{total.toFixed(2)}</span>
      </div>
    </div>
  );
}

export async function getServerSideProps({ req }) {
  const tenant = await getTenantFromRequest(req);
  if (!tenant) return { notFound: true };
  return { props: { tenant } };
}
