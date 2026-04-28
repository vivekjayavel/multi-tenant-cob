import Link from 'next/link';
import { m as motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';
import MetaTags from '../components/seo/MetaTags';
import { useCart } from '../context/CartContext';
const { noindexSeo }           = require('../lib/seo');
const { getTenantFromRequest } = require('../lib/prefetch');

export default function CartPage({ tenant }) {
  const { items, total, originalTotal, totalSavings, dispatch, hydrated } = useCart();
  const seo = noindexSeo(tenant, 'Cart');

  return (
    <>
      <MetaTags seo={seo} tenant={tenant} />
      <Layout tenant={tenant}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-36 pb-20">
          <h1 className="font-display text-3xl text-gray-900 mb-8">Your Cart</h1>

          {/* Show skeleton until cart is hydrated from localStorage */}
          {!hydrated ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-5xl mb-4">🛒</p>
              <p className="text-gray-400 mb-6">Your cart is empty.</p>
              <Link href="/products" className="text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                style={{ backgroundColor: 'var(--tenant-primary)' }}>Browse Menu</Link>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {items.map(item => (
                  <motion.div key={item.id} layout
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    {item.image_url && <img src={item.image_url} alt={item.name} className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{item.name}</p>
                      <p className="font-semibold mt-1" style={{ color: 'var(--tenant-primary)' }}>₹{item.price}</p>
                      {item.customization && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {Object.entries(item.customization).map(([k, v]) => v && (
                            <span key={k} className="inline-flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              <span className="capitalize font-medium">{k}:</span> {v.length > 20 ? v.slice(0,20)+'…' : v}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => dispatch({ type: 'UPDATE_QTY', key: item._key || String(item.id), quantity: item.quantity - 1 })}
                          className="w-7 h-7 rounded-full border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-50">−</button>
                        <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                        <button onClick={() => dispatch({ type: 'UPDATE_QTY', key: item._key || String(item.id), quantity: item.quantity + 1 })}
                          className="w-7 h-7 rounded-full border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-50">+</button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <p className="font-bold text-gray-800">₹{(item.price * item.quantity).toFixed(2)}</p>
                      <button onClick={() => dispatch({ type: 'REMOVE', key: item._key || String(item.id) })}
                        className="text-gray-300 hover:text-red-400 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mt-6 space-y-3">
                {totalSavings > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 line-through">MRP</span>
                    <span className="text-gray-400 line-through">₹{originalTotal.toFixed(2)}</span>
                  </div>
                )}
                {totalSavings > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-medium">🎉 Discount</span>
                    <span className="text-green-600 font-semibold">-₹{totalSavings.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm border-t border-gray-100 pt-3">
                  <span className="text-gray-700 font-semibold">Total</span>
                  <span className="font-bold text-gray-900 text-base">₹{total.toFixed(2)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="bg-green-50 rounded-xl px-4 py-2 text-center">
                    <p className="text-xs text-green-700 font-semibold">You save ₹{totalSavings.toFixed(2)} on this order! 🎂</p>
                  </div>
                )}
                <Link href="/checkout" className="block w-full text-white text-sm font-semibold py-4 rounded-xl text-center transition-all hover:-translate-y-0.5 mt-2"
                  style={{ backgroundColor: 'var(--tenant-primary)' }}>Proceed to Checkout</Link>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}

export async function getServerSideProps({ req }) {
  const tenant = await getTenantFromRequest(req);
  if (!tenant) return { notFound: true };
  return { props: { tenant } };
}
