import { useRouter } from 'next/router';
import { m as motion } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useTenant } from '../../context/TenantContext';

export default function ProductCard({ product }) {
  const { dispatch } = useCart();
  const tenant  = useTenant();
  const router  = useRouter();

  const whatsappHref = tenant?.whatsapp_number
    ? `https://wa.me/${tenant.whatsapp_number}?text=${encodeURIComponent(`Hi! I'm interested in ${product.name} (₹${product.price}). Is it available?`)}`
    : null;

  const available = product.available_qty ?? product.stock_qty ?? 0;

  const addToCart = (e) => {
    e.stopPropagation();
    dispatch({
      type: 'ADD',
      item: {
        id:        product.id,
        name:      product.name,
        price:     parseFloat(product.price),
        image_url: product.image_url,
        slug:      product.slug,
      },
    });
  };

  const goToProduct = () => router.push(`/products/${product.slug}`);

  // ── Fix: No <Link> wrapping block elements — use onClick for navigation
  // This avoids the invalid HTML pattern of <div> or <a> inside <a>
  // which causes React hydration mismatches.
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      onClick={goToProduct}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100 cursor-pointer"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-stone-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">🎂</div>
        )}

        {product.category && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-600 px-2.5 py-1 rounded-full">
            {product.category}
          </span>
        )}

        {available === 0 && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1.5 rounded-full">Sold Out</span>
          </div>
        )}

        {/* WhatsApp overlay — stopPropagation so it doesn't navigate */}
        {whatsappHref && available > 0 && (
          <div className="absolute inset-0 bg-black/20 flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-[#25D366] text-white text-xs font-semibold py-2.5 rounded-xl text-center hover:bg-[#1ebe5d] transition-colors"
            >
              Enquire on WhatsApp
            </a>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-display font-semibold text-gray-800 text-base leading-snug line-clamp-2">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <p className="font-bold text-lg" style={{ color: 'var(--tenant-primary)' }}>
            ₹{parseFloat(product.price).toLocaleString('en-IN')}
          </p>
          <button
            onClick={addToCart}
            disabled={available === 0}
            className="text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--tenant-primary)' }}
          >
            Add
          </button>
        </div>
      </div>
    </motion.article>
  );
}
