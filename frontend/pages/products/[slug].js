import { useState } from 'react';
import { m as motion } from 'framer-motion';
import Layout from '../../components/layout/Layout';
import MetaTags from '../../components/seo/MetaTags';
import CinematicImage from '../../components/ui/CinematicImage';
import CustomizeModal from '../../components/ui/CustomizeModal';
import ImageGallery from '../../components/ui/ImageGallery';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../components/ui/Toast';
const { productDetailSeo }    = require('../../lib/seo');
const { getTenantFromRequest } = require('../../lib/prefetch');

function hasCustomization(product) {
  if (!product?.customization_options) return false;
  try {
    const opts = typeof product.customization_options === 'string'
      ? JSON.parse(product.customization_options)
      : product.customization_options;
    return Object.values(opts).some(o => o?.enabled);
  } catch { return false; }
}

export default function ProductDetailPage({ tenant, product, settings }) {
  const [qty,       setQty]       = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const { dispatch } = useCart();
  const toast = useToast();
  const seo          = productDetailSeo(tenant, product);
  const available    = product.available_qty ?? product.stock_qty ?? 0;
  const allImages = (() => {
    const imgs = [];
    if (product.image_url) imgs.push(product.image_url);
    if (product.images) {
      const extra = typeof product.images === 'string'
        ? JSON.parse(product.images || '[]') : product.images;
      extra.forEach(i => { const u = i?.url || i; if (u && !imgs.includes(u)) imgs.push(u); });
    }
    return imgs;
  })();
  const needsOptions = hasCustomization(product);

  const whatsappHref = tenant?.whatsapp_number
    ? `https://wa.me/${tenant.whatsapp_number}?text=${encodeURIComponent(`Hi! I'd like to order ${qty}x ${product.name} (₹${product.price} each). Is it available?`)}`
    : null;

  const handleAddToCart = () => {
    if (needsOptions) { setShowModal(true); return; }
    dispatch({ type: 'ADD', item: {
      id: product.id, name: product.name,
      price: parseFloat(product.price),
      image_url: product.image_url, slug: product.slug,
      quantity: qty,
    }});
    toast({ message: `${product.name} added to cart 🛒`, type: 'success', duration: 2000 });
  };

  return (
    <>
      <MetaTags seo={seo} tenant={tenant} />
      <Layout tenant={tenant} settings={settings}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-36 pb-20">
          <div className="grid md:grid-cols-2 gap-12 items-start">

            {/* Image gallery */}
            <motion.div initial={{ opacity:0, x:-30 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.7, ease:[0.16,1,0.3,1] }}
              className="flex flex-col gap-3">

              {/* Main selected image */}
              <div className="relative aspect-square rounded-3xl overflow-hidden bg-stone-100 shadow-2xl cursor-pointer"
                onClick={() => allImages.length > 0 && setShowGallery(true)}>
                <img
                  src={allImages[activeImageIdx] || product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
                {product.category && (
                  <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-600 px-3 py-1.5 rounded-full shadow-sm">
                    {product.category}
                  </span>
                )}
                {needsOptions && (
                  <span className="absolute top-4 right-4 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm"
                    style={{ backgroundColor: 'var(--tenant-primary)' }}>
                    ✦ Customisable
                  </span>
                )}
                {allImages.length > 1 && (
                  <div className="absolute bottom-3 right-3 bg-black/50 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {activeImageIdx + 1} / {allImages.length}
                  </div>
                )}
              </div>

              {/* Scrollable thumbnail strip */}
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImageIdx(i)}
                      className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                        activeImageIdx === i
                          ? 'border-current scale-105 shadow-md'
                          : 'border-transparent opacity-60 hover:opacity-90'
                      }`}
                      style={activeImageIdx === i ? { borderColor: 'var(--tenant-primary)' } : {}}
                    >
                      <img src={img} alt={`${product.name} ${i+1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Details */}
            <motion.div initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.7, delay:0.1, ease:[0.16,1,0.3,1] }}
              className="space-y-6 pt-4">
              <div>
                <h1 className="font-display text-4xl text-gray-900 leading-tight">{product.name}</h1>
                <p className="text-3xl font-bold mt-3" style={{ color:'var(--tenant-primary)' }}>
                  ₹{parseFloat(product.price).toLocaleString('en-IN')}
                </p>
              </div>

              {product.description && (
                <p className="text-gray-500 leading-relaxed">{product.description}</p>
              )}

              {/* Stock badge — hidden for customisable products */}
              {!needsOptions && (
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${available > 0 ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className={`text-sm font-medium ${available > 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {available > 0 ? `In stock (${available} available)` : 'Currently out of stock'}
                  </span>
                </div>
              )}

              {product.delivery_time && (
                <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                  <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Delivery Time</p>
                    <p className="text-sm text-amber-800 font-medium">{product.delivery_time}</p>
                  </div>
                </div>
              )}

              {available > 0 && (
                <div className="space-y-4">
                  {/* Qty selector — only show if no customization (modal handles qty) */}
                  {!needsOptions && (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                        <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-4 py-3 text-gray-600 hover:bg-gray-50 transition-colors font-medium">−</button>
                        <span className="px-5 py-3 text-sm font-semibold border-x border-gray-200 min-w-[52px] text-center">{qty}</span>
                        <button onClick={() => setQty(q => Math.min(available, q + 1))} className="px-4 py-3 text-gray-600 hover:bg-gray-50 transition-colors font-medium">+</button>
                      </div>
                      <p className="text-sm text-gray-400">Total: <strong className="text-gray-700">₹{(parseFloat(product.price) * qty).toLocaleString('en-IN')}</strong></p>
                    </div>
                  )}

                  {needsOptions && (
                    <p className="text-sm text-gray-500 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                      ✦ This product can be customised — choose your weight, flavour, occasion and more.
                    </p>
                  )}

                  <motion.button onClick={handleAddToCart}
                    className="w-full text-white font-semibold py-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2"
                    style={{ backgroundColor:'var(--tenant-primary)' }}
                    whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}>
                    {needsOptions ? (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                        Customise & Add to Cart
                      </>
                    ) : 'Add to Cart'}
                  </motion.button>

                  {whatsappHref && (
                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2.5 border border-[#25D366] text-[#25D366] font-semibold py-4 rounded-xl hover:bg-[#25D366] hover:text-white transition-all duration-200">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Enquire on WhatsApp
                    </a>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </Layout>

      {showModal && (
        <CustomizeModal product={product} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

export async function getServerSideProps({ req, params, res }) {
  const db     = require('../../../backend/config/db');
  const tenant = await getTenantFromRequest(req);
  if (!tenant) return { notFound: true };
  const [[productRow]] = await db.query(
    'SELECT id, is_active FROM products WHERE tenant_id = ? AND slug = ? LIMIT 1',
    [tenant.id, params.slug]
  );
  if (!productRow) return { notFound: true };
  if (!productRow.is_active) { res.statusCode = 410; return { props: { tenant, product: null, deleted: true } }; }
  const [[product]] = await db.query(
    'SELECT id, name, description, price, image_url, images, category, slug, stock_qty, reserved_qty, customization_options, delivery_time, sort_order, created_at, updated_at FROM products WHERE tenant_id = ? AND slug = ? AND is_active = 1 LIMIT 1',
    [tenant.id, params.slug]
  );
  if (!product) return { notFound: true };
  let settings = null;
  if (tenant.tenant_settings) {
    try {
      settings = typeof tenant.tenant_settings === 'string'
        ? JSON.parse(tenant.tenant_settings)
        : tenant.tenant_settings;
    } catch {}
  }

  return { props: { tenant, settings, product: JSON.parse(JSON.stringify({
    ...product,
    available_qty: Math.max(0, product.stock_qty - product.reserved_qty),
    customization_options: product.customization_options
      ? (typeof product.customization_options === 'string'
          ? product.customization_options
          : JSON.stringify(product.customization_options))
      : null,
    // Normalize images to JSON string for consistent SSR/client handling
    images: product.images
      ? (typeof product.images === 'string'
          ? product.images
          : JSON.stringify(product.images))
      : null,
  })) } };
}
