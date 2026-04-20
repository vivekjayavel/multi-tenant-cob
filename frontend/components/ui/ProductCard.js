import { useRouter } from 'next/router';
import { m as motion } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useTenant } from '../../context/TenantContext';
import CinematicImage from './CinematicImage';

export default function ProductCard({ product, index = 0 }) {
  const { dispatch } = useCart();
  const tenant  = useTenant();
  const router  = useRouter();

  const whatsappHref = tenant?.whatsapp_number
    ? `https://wa.me/${tenant.whatsapp_number}?text=${encodeURIComponent(`Hi! I'm interested in ${product.name} (₹${product.price}). Is it available?`)}`
    : null;

  const available = product.available_qty ?? product.stock_qty ?? 0;

  const addToCart = (e) => {
    e.stopPropagation();
    dispatch({ type: 'ADD', item: {
      id: product.id, name: product.name,
      price: parseFloat(product.price),
      image_url: product.image_url, slug: product.slug,
    }});
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay: (index % 4) * 0.08, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => router.push(`/products/${product.slug}`)}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-shadow duration-500 border border-gray-100 cursor-pointer"
    >
      {/* ── Cinematic product image ── */}
      <div className="relative aspect-square overflow-hidden bg-stone-100">
        <CinematicImage
          src={product.image_url}
          alt={product.name}
          reveal="scale"
          delay={(index % 4) * 0.06}
          className="transition-transform duration-700 group-hover:scale-[1.07]"
          containerClassName="w-full h-full"
        />

        {/* Category badge */}
        {product.category && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + (index % 4) * 0.06 }}
            className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-600 px-2.5 py-1 rounded-full shadow-sm z-10"
          >
            {product.category}
          </motion.span>
        )}

        {/* Sold out overlay */}
        {available === 0 && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="bg-gray-900/80 text-white text-xs font-bold px-4 py-2 rounded-full tracking-wide">
              Sold Out
            </span>
          </div>
        )}

        {/* Hover overlay with WhatsApp */}
        {whatsappHref && available > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="w-full bg-[#25D366] text-white text-xs font-semibold py-2.5 rounded-xl text-center hover:bg-[#1ebe5d] transition-colors backdrop-blur-sm"
            >
              💬 Enquire on WhatsApp
            </a>
          </motion.div>
        )}
      </div>

      {/* ── Product info ── */}
      <div className="p-4">
        <h3 className="font-display font-semibold text-gray-800 text-base leading-snug line-clamp-2 group-hover:text-gray-900 transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <motion.p
            className="font-bold text-lg"
            style={{ color: 'var(--tenant-primary)' }}
          >
            ₹{parseFloat(product.price).toLocaleString('en-IN')}
          </motion.p>
          <motion.button
            onClick={addToCart}
            disabled={available === 0}
            className="text-white text-xs font-semibold px-4 py-2 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden relative"
            style={{ backgroundColor: 'var(--tenant-primary)' }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            Add
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
