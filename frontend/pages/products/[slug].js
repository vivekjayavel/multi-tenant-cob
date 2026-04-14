import { useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '../../components/layout/Layout';
import MetaTags from '../../components/seo/MetaTags';
import { useCart } from '../../context/CartContext';
const { productDetailSeo }    = require('../../lib/seo');
const { getTenantFromRequest } = require('../../lib/prefetch');

export default function ProductDetailPage({ tenant, product }) {
  const [qty, setQty] = useState(1);
  const { dispatch }  = useCart();
  const seo           = productDetailSeo(tenant, product);
  const available     = product.available_qty ?? product.stock_qty ?? 0;

  const whatsappHref = tenant?.whatsapp_number
    ? `https://wa.me/${tenant.whatsapp_number}?text=${encodeURIComponent(`Hi! I'd like to order ${qty}x ${product.name} (₹${product.price} each). Is it available?`)}`
    : null;

  const addToCart = () => dispatch({ type: 'ADD', item: { id: product.id, name: product.name, price: parseFloat(product.price), image_url: product.image_url, slug: product.slug, quantity: qty } });

  return (
    <>
      <MetaTags seo={seo} tenant={tenant} />
      <Layout tenant={tenant}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-32 pb-20">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="relative aspect-square rounded-3xl overflow-hidden bg-stone-100 shadow-lg">
              {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-8xl opacity-20">🎂</div>}
              {product.category && <span className="absolute top-4 left-4 bg-white text-xs font-semibold text-gray-600 px-3 py-1.5 rounded-full shadow-sm">{product.category}</span>}
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="space-y-6 pt-4">
              <div>
                <h1 className="font-display text-4xl text-gray-900 leading-tight">{product.name}</h1>
                <p className="text-3xl font-bold mt-3" style={{ color: 'var(--tenant-primary)' }}>₹{parseFloat(product.price).toLocaleString('en-IN')}</p>
              </div>
              {product.description && <p className="text-gray-500 leading-relaxed">{product.description}</p>}
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${available > 0 ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className={`text-sm font-medium ${available > 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {available > 0 ? `In stock (${available} available)` : 'Currently out of stock'}
                </span>
              </div>
              {available > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                      <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-4 py-3 text-gray-600 hover:bg-gray-50 transition-colors font-medium">−</button>
                      <span className="px-5 py-3 text-sm font-semibold border-x border-gray-200 min-w-[52px] text-center">{qty}</span>
                      <button onClick={() => setQty(q => Math.min(available, q + 1))} className="px-4 py-3 text-gray-600 hover:bg-gray-50 transition-colors font-medium">+</button>
                    </div>
                    <p className="text-sm text-gray-400">Total: <strong className="text-gray-700">₹{(parseFloat(product.price) * qty).toLocaleString('en-IN')}</strong></p>
                  </div>
                  <button onClick={addToCart} className="w-full text-white font-semibold py-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg" style={{ backgroundColor: 'var(--tenant-primary)' }}>Add to Cart</button>
                  {whatsappHref && (
                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2.5 border border-[#25D366] text-[#25D366] font-semibold py-4 rounded-xl hover:bg-[#25D366] hover:text-white transition-all duration-200">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      Enquire on WhatsApp
                    </a>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </Layout>
    </>
  );
}

export async function getServerSideProps({ req, params, res }) {
  const db     = require('../../../backend/config/db');
  const tenant = await getTenantFromRequest(req);
  if (!tenant) return { notFound: true };
  const [[productRow]] = await db.query('SELECT id, is_active FROM products WHERE tenant_id = ? AND slug = ? LIMIT 1', [tenant.id, params.slug]);
  if (!productRow) return { notFound: true };
  if (!productRow.is_active) { res.statusCode = 410; return { props: { tenant, product: null, deleted: true } }; }
  const [[product]] = await db.query('SELECT id, name, description, price, image_url, category, slug, stock_qty, reserved_qty, created_at, updated_at FROM products WHERE tenant_id = ? AND slug = ? AND is_active = 1 LIMIT 1', [tenant.id, params.slug]);
  if (!product) return { notFound: true };
  return { props: { tenant, product: JSON.parse(JSON.stringify({ ...product, available_qty: Math.max(0, product.stock_qty - product.reserved_qty) })) } };
}
