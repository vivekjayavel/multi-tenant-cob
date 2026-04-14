import { motion } from 'framer-motion';
import Link from 'next/link';
import Layout from '../components/layout/Layout';
import HeroSection from '../components/ui/HeroSection';
import ProductCard from '../components/ui/ProductCard';
import MetaTags from '../components/seo/MetaTags';
const { homeSeo }               = require('../lib/seo');
const { getTenantFromRequest, getFeaturedProducts } = require('../lib/prefetch');

export default function HomePage({ tenant, featuredProducts }) {
  const seo = homeSeo(tenant);
  return (
    <>
      <MetaTags seo={seo} tenant={tenant} />
      <Layout tenant={tenant}>
        <HeroSection />
        {featuredProducts.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 py-24">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--tenant-primary)' }}>This Week's Picks</p>
              <h2 className="font-display text-4xl text-gray-900">Fresh From the Oven</h2>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mt-12">
              <Link href="/products" className="inline-flex items-center gap-2 border font-semibold px-7 py-3 rounded-full transition-all duration-200 hover:-translate-y-0.5 hover:text-white hover:shadow-lg" style={{ borderColor: 'var(--tenant-primary)', color: 'var(--tenant-primary)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--tenant-primary)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'var(--tenant-primary)'; }}>
                View Full Menu
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </motion.div>
          </section>
        )}
        <section className="bg-stone-50 py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-display text-3xl text-center text-gray-900 mb-12">Why Choose {tenant.name}</motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                { icon: '🌾', title: 'Real Ingredients',  desc: 'No preservatives, no shortcuts. Every recipe uses premium, natural ingredients.' },
                { icon: '⏰', title: 'Baked Fresh Daily', desc: 'Everything is baked fresh every morning. We never sell day-old products.'        },
                { icon: '🚚', title: 'Same-Day Delivery', desc: 'Order before noon and get delivery by evening within the city.'                    },
              ].map((f, i) => (
                <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white rounded-2xl p-7 text-center shadow-sm">
                  <span className="text-4xl">{f.icon}</span>
                  <h3 className="font-display font-semibold text-gray-800 mt-4 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </Layout>
    </>
  );
}

export async function getServerSideProps({ req }) {
  const tenant = await getTenantFromRequest(req);
  if (!tenant) return { notFound: true };
  const featuredProducts = await getFeaturedProducts(tenant.id, 8);
  return { props: { tenant, featuredProducts } };
}
