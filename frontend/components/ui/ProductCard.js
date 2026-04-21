import { useState } from 'react';
import { useRouter } from 'next/router';
import { m as motion } from 'framer-motion';
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

export default function ProductCard({ product, index = 0 }) {
  const { dispatch }  = useCart();
  const tenant        = useTenant();
  const router        = useRouter();
  const [showModal, setShowModal] = useState(false);

  const whatsappHref = tenant?.whatsapp_number
    ? `https://wa.me/${tenant.whatsapp_number}?text=${encodeURIComponent(`Hi! I'm interested in ${product.name} (₹${product.price}). Is it available?`)}`
    : null;

  const available    = product.available_qty ?? product.stock_qty ?? 0;
  const needsOptions = hasCustomization(product);

  const handleAdd = (e) => {
    e.stopPropagation();
    if (needsOptions) {
      setShowModal(true);
    } else {
      dispatch({ type: 'ADD', item: {
        id: product.id, name: product.name,
        price: parseFloat(product.price),
        image_url: product.image_url, slug: product.slug,
      }});
    }
  };

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.6, delay: (index % 4) * 0.08, ease: [0.16, 1, 0.3, 1] }}
        onClick={() => router.push(`/products/${product.slug}`)}
        className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-shadow duration-500 border border-gray-100 cursor-pointer"
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-stone-100">
          <CinematicImage
            src={product.image_url}
            alt={product.name}
            reveal="scale"
            delay={(index % 4) * 0.06}
            className="transition-transform duration-700 group-hover:scale-[1.07]"
            containerClassName="w-full h-full"
          />

          {product.category && (
            <motion.span
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + (index % 4) * 0.06 }}
              className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-600 px-2.5 py-1 rounded-full shadow-sm z-10"
            >
              {product.category}
            </motion.span>
          )}

          {/* Customizable badge */}
          {needsOptions && (
            <span className="absolute top-3 right-3 text-white text-[10px] font-bold px-2 py-1 rounded-full z-10"
              style={{ backgroundColor: 'var(--tenant-primary)' }}>
              Customisable
            </span>
          )}

          {available === 0 && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center z-10">
              <span className="bg-gray-900/80 text-white text-xs font-bold px-4 py-2 rounded-full">Sold Out</span>
            </div>
          )}

          {whatsappHref && available > 0 && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="w-full bg-[#25D366] text-white text-xs font-semibold py-2.5 rounded-xl text-center hover:bg-[#1ebe5d] transition-colors">
                💬 Enquire on WhatsApp
              </a>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-display font-semibold text-gray-800 text-base leading-snug line-clamp-2">{product.name}</h3>
          {product.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
          )}
          <div className="flex items-center justify-between mt-3">
            <p className="font-bold text-lg" style={{ color: 'var(--tenant-primary)' }}>
              ₹{parseFloat(product.price).toLocaleString('en-IN')}
            </p>
            <motion.button
              onClick={handleAdd}
              disabled={available === 0}
              className="text-white text-xs font-semibold px-4 py-2 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              style={{ backgroundColor: 'var(--tenant-primary)' }}
              whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}
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
