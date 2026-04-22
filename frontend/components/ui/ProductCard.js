import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { m as motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useTenant } from '../../context/TenantContext';
import CinematicImage from './CinematicImage';
import CustomizeModal from './CustomizeModal';

function hasCustomization(product) {
  if (!product.customization_options) return false;
  try {
    const opts = typeof product.customization_options === 'string'
      ? JSON.parse(product.customization_options)
      : product.customization_options;
    return Object.values(opts).some(o => o?.enabled);
  } catch { return false; }
}

// Rotate through hover effects for visual variety
const HOVER_EFFECTS = ['zoom', 'shine', 'reveal', 'zoom', 'shine', 'reveal'];

export default function ProductCard({ product, index = 0 }) {
  const { dispatch }   = useCart();
  const tenant         = useTenant();
  const router         = useRouter();
  const [showModal,    setShowModal]    = useState(false);
  const [needsOptions, setNeedsOptions] = useState(false);
  const [isHovered,    setIsHovered]    = useState(false);

  const hoverEffect = HOVER_EFFECTS[index % HOVER_EFFECTS.length];

  const whatsappHref = tenant?.whatsapp_number
    ? `https://wa.me/${tenant.whatsapp_number}?text=${encodeURIComponent(
        `Hi! I'm interested in ${product.name} (₹${product.price}). Is it available?`
      )}`
    : null;

  const available = product.available_qty ?? product.stock_qty ?? 0;

  useEffect(() => {
    setNeedsOptions(hasCustomization(product));
  }, [product.customization_options]);

  const handleAdd = (e) => {
    e.stopPropagation();
    if (needsOptions) { setShowModal(true); return; }
    dispatch({ type: 'ADD', item: {
      id: product.id, name: product.name,
      price: parseFloat(product.price),
      image_url: product.image_url, slug: product.slug,
    }});
  };

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.6, delay: (index % 4) * 0.08, ease: [0.16, 1, 0.3, 1] }}
        onClick={() => router.push(`/products/${product.slug}`)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer flex flex-col h-full"
        style={{ boxShadow: isHovered ? '0 20px 60px -10px rgba(0,0,0,0.18)' : '' }}
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* ── Cinematic image ── */}
        <div className="relative aspect-square overflow-hidden bg-stone-100 flex-shrink-0">
          <CinematicImage
            src={product.image_url}
            alt={product.name}
            reveal="scale"
            delay={(index % 4) * 0.06}
            hoverEffect={hoverEffect}
            containerClassName="w-full h-full"
          />

          {/* Category badge */}
          {product.category && (
            <motion.span
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + (index % 4) * 0.06 }}
              className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-600 px-2.5 py-1 rounded-full shadow-sm z-10"
            >
              {product.category}
            </motion.span>
          )}

          {/* Customisable badge */}
          {needsOptions && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className="absolute top-3 right-3 text-white text-[10px] font-bold px-2 py-1 rounded-full z-10"
              style={{ backgroundColor: 'var(--tenant-primary)' }}
            >
              ✦ Customisable
            </motion.span>
          )}

          {/* Sold out */}
          {available === 0 && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center z-10">
              <span className="bg-gray-900/80 text-white text-xs font-bold px-4 py-2 rounded-full">Sold Out</span>
            </div>
          )}

          {/* WhatsApp hover overlay */}
          <AnimatePresence>
            {isHovered && whatsappHref && available > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-x-0 bottom-0 p-3 z-20"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)' }}
              >
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center justify-center gap-1.5 w-full bg-[#25D366] text-white text-xs font-semibold py-2.5 rounded-xl hover:bg-[#1ebe5d] transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Enquire on WhatsApp
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Product info ── */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-display font-semibold text-gray-800 text-base leading-snug line-clamp-2">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
          )}

          {/* Delivery time */}
          {product.delivery_time && (
            <div className="flex items-center gap-1.5 mt-2">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs text-gray-500">{product.delivery_time}</span>
            </div>
          )}

          {/* Price + CTA */}
          <div className="flex items-center justify-between mt-auto pt-3">
            <motion.p
              className="font-bold text-lg"
              style={{ color: 'var(--tenant-primary)' }}
              animate={{ scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.2 }}
            >
              ₹{parseFloat(product.price).toLocaleString('en-IN')}
            </motion.p>

            <motion.button
              onClick={handleAdd}
              disabled={available === 0}
              className="text-white text-xs font-semibold px-4 py-2 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 overflow-hidden relative"
              style={{ backgroundColor: 'var(--tenant-primary)' }}
              whileHover={{ scale: 1.08, boxShadow: '0 6px 20px -4px color-mix(in srgb, var(--tenant-primary) 50%, transparent)' }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {needsOptions ? (
                <>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  Customise
                </>
              ) : 'Add'}
            </motion.button>
          </div>
        </div>
      </motion.article>

      {showModal && (
        <CustomizeModal product={product} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
