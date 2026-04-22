import { useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
const SwiperCarousel = dynamic(() => import('../../components/ui/SwiperCarousel'), { ssr: false });
const SwiperSlide = dynamic(() => import('../../components/ui/SwiperCarousel').then(m => ({ default: m.SwiperSlide })), { ssr: false });
import Layout from '../../components/layout/Layout';
import ProductCard from '../../components/ui/ProductCard';
import MetaTags from '../../components/seo/MetaTags';
const { productListSeo }                           = require('../../lib/seo');
const { getTenantFromRequest, getProductsForPage } = require('../../lib/prefetch');

export default function ProductsPage({ tenant, products, categories }) {
  const [active, setActive] = useState('All');
  const seo      = productListSeo(tenant);
  const filtered = active === 'All' ? products : products.filter(p => p.category === active);
  return (
    <>
      <MetaTags seo={seo} tenant={tenant} />
      <Layout tenant={tenant}>
        <div className="bg-stone-50 pt-32 pb-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--tenant-primary)' }}>Our Menu</motion.p>
            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-display text-5xl text-gray-900">Fresh Baked Goods</motion.h1>
          </div>
        </div>
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-3">
              {['All', ...categories].map(cat => (
                <button key={cat} onClick={() => setActive(cat)}
                  className={`flex-shrink-0 text-sm font-medium px-5 py-2 rounded-full transition-all duration-200 ${active === cat ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                  style={active === cat ? { backgroundColor: 'var(--tenant-primary)' } : {}}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.length > 0
                ? filtered.map(p => <ProductCard key={p.id} product={p} />)
                : <div className="col-span-full py-24 text-center"><p className="text-4xl mb-4">🥐</p><p className="text-gray-400 text-sm">No products in this category yet.</p></div>
              }
            </motion.div>
          </AnimatePresence>
        </div>
      </Layout>
    </>
  );
}

export async function getServerSideProps({ req }) {
  const tenant = await getTenantFromRequest(req);
  if (!tenant) return { notFound: true };
  const products   = await getProductsForPage(tenant.id);
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  return { props: { tenant, products: JSON.parse(JSON.stringify(products)), categories } };
}
