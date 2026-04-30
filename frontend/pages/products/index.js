import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { m as motion, AnimatePresence } from 'framer-motion';
import Layout from '../../components/layout/Layout';
import ProductCard from '../../components/ui/ProductCard';
import MetaTags from '../../components/seo/MetaTags';

const { productListSeo }                           = require('../../lib/seo');
const { getTenantFromRequest, getProductsForPage } = require('../../lib/prefetch');

export default function ProductsPage({ tenant, products, categories, initialCategory, settings }) {
  const router = useRouter();
  const [active, setActive] = useState(initialCategory || 'All');

  // Sync category filter whenever the URL query changes (navbar menu clicks)
  useEffect(() => {
    const cat = router.query.category || 'All';
    setActive(cat);
  }, [router.query.category]);

  const seo      = productListSeo(tenant);
  const filtered = active === 'All'
    ? products
    : products.filter(p => p.category === active);

  return (
    <>
      <MetaTags seo={seo} tenant={tenant} />
      <Layout tenant={tenant} settings={settings}>

        {/* Header */}
        <div className="bg-stone-50 pt-20 sm:pt-32 pb-8 sm:pb-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-sm font-semibold tracking-widest uppercase mb-3"
              style={{ color: 'var(--tenant-primary)' }}>
              Our Menu
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }} className="font-display text-base sm:text-xl sm:text-2xl lg:text-3xl sm:text-4xl lg:text-5xl text-gray-900">
              Fresh Baked Goods
            </motion.h1>
          </div>
        </div>

        {/* Sticky category tabs */}
        <div className="sticky z-30 bg-white/95 backdrop-blur-md border-b border-gray-100"
          style={{ top: '80px' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-3">
              {['All', ...categories].map(cat => (
                <button key={cat}
                  onClick={() => {
                    setActive(cat);
                    // Update URL so it's shareable and browser back works
                    router.replace(
                      cat === 'All' ? '/products' : `/products?category=${encodeURIComponent(cat)}`,
                      undefined,
                      { shallow: true }
                    );
                  }}
                  className={`flex-shrink-0 text-sm font-medium px-5 py-2 rounded-full transition-all duration-200 ${
                    active === cat
                      ? 'text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                  style={active === cat ? { backgroundColor: 'var(--tenant-primary)' } : {}}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products grid */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {filtered.length > 0 ? (
                <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {filtered.map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} />
                  ))}
                </div>
              ) : (
                <div className="py-24 text-center">
                  <p className="text-lg sm:text-xl lg:text-2xl sm:text-3xl lg:text-4xl mb-4">🥐</p>
                  <p className="text-gray-400 text-sm">
                    {active === 'All' ? 'No products yet.' : `No products in "${active}" yet.`}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </Layout>
    </>
  );
}

export async function getServerSideProps(ctx) {
  const tenant = await getTenantFromRequest(ctx.req);
  if (!tenant) return { notFound: true };

  const products = await getProductsForPage(tenant.id);

  // Sort: Cakes first, then alphabetical
  const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
  const categories = cats.sort((a, b) => {
    if (a.toLowerCase().includes('cake') && !b.toLowerCase().includes('cake')) return -1;
    if (!a.toLowerCase().includes('cake') && b.toLowerCase().includes('cake')) return 1;
    return a.localeCompare(b);
  });

  let settings = null;
  if (tenant.tenant_settings) {
    try {
      settings = typeof tenant.tenant_settings === 'string'
        ? JSON.parse(tenant.tenant_settings)
        : tenant.tenant_settings;
    } catch {}
  }

  const initialCategory = ctx.query.category || 'All';
  return { props: { tenant, products: JSON.parse(JSON.stringify(products)), categories, initialCategory, settings } };
}
