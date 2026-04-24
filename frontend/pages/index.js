import { m as motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import CinematicHero from '../components/ui/CinematicHero';
import Layout from '../components/layout/Layout';
import ProductCard from '../components/ui/ProductCard';
import MetaTags from '../components/seo/MetaTags';

const SwiperCarousel = dynamic(() => import('../components/ui/SwiperCarousel'), { ssr: false });

const { homeSeo }               = require('../lib/seo');
const { getTenantFromRequest, getProductsByCategory } = require('../lib/prefetch');

const DEFAULT_FEATURES = [
  { icon: '🌾', title: 'Real Ingredients',  desc: 'No preservatives, no shortcuts. Every recipe uses premium, natural ingredients.' },
  { icon: '⏰', title: 'Baked Fresh Daily', desc: 'Everything is baked fresh every morning. We never sell day-old products.' },
  { icon: '🚚', title: 'Same-Day Delivery', desc: 'Order before noon and get delivery by evening within the city.' },
];

export default function HomePage({ tenant, categoryGroups, settings }) {
  const seo   = homeSeo(tenant);
  const feats = settings?.features?.length ? settings.features : DEFAULT_FEATURES;

  return (
    <>
      <MetaTags seo={seo} tenant={tenant} />
      <Layout tenant={tenant} settings={settings}>

        {/* ── Cinematic Hero ── */}
        <CinematicHero hero={settings?.hero} settings={settings} />

        {/* ── Per-Category Product Sections ── */}
        {categoryGroups.length > 0 && (
          <div className="py-16 space-y-16">
            {categoryGroups.map(({ category, products }, idx) => (
              <section key={category} className="overflow-hidden">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                  {/* Category heading */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.05 }}
                    className="flex items-center justify-between mb-6"
                  >
                    <div className="flex items-center gap-3">
                      {/* Accent line */}
                      <div className="w-1 h-7 rounded-full" style={{ backgroundColor: 'var(--tenant-primary)' }} />
                      <h2 className="font-display text-2xl text-gray-900">{category}</h2>
                      <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                        {products.length} item{products.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <a
                      href={`/products?category=${encodeURIComponent(category)}`}
                      className="text-sm font-semibold transition-colors hover:opacity-70 flex items-center gap-1"
                      style={{ color: 'var(--tenant-primary)' }}
                    >
                      View all
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </motion.div>

                  {/* Products carousel for this category */}
                  <SwiperCarousel
                    slidesPerView={1.5}
                    spaceBetween={12}
                    navigation={products.length > 4}
                    pagination={products.length > 2}
                    breakpoints={{
                      480:  { slidesPerView: 2,   spaceBetween: 12 },
                      768:  { slidesPerView: 2,   spaceBetween: 20 },
                      1024: { slidesPerView: 3,   spaceBetween: 28 },
                      1280: { slidesPerView: 3,   spaceBetween: 32 },
                    }}
                  >
                    {products.map((p, i) => (
                      <div key={p.id}>
                        <ProductCard product={p} index={i} />
                      </div>
                    ))}
                  </SwiperCarousel>
                </div>
              </section>
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {categoryGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <span className="text-6xl">🎂</span>
            <p className="text-gray-500 text-lg">No products yet</p>
          </div>
        )}

        {/* ── Features ── */}
        {feats.length > 0 && (
          <section className="bg-stone-50 py-20 overflow-hidden">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="font-display text-3xl text-center text-gray-900 mb-10"
              >
                Why Choose {tenant.name}
              </motion.h2>

              {/* Mobile swiper */}
              <div className="block sm:hidden">
                <SwiperCarousel slidesPerView={1.1} spaceBetween={12} pagination={true} centeredSlides={true}>
                  {feats.map((f, i) => (
                    <div key={i}><FeatureCard f={f} /></div>
                  ))}
                </SwiperCarousel>
              </div>

              {/* Desktop grid */}
              <div className="hidden sm:grid sm:grid-cols-3 gap-8">
                {feats.map((f, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -6 }}
                  >
                    <FeatureCard f={f} />
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}
      </Layout>
    </>
  );
}

function FeatureCard({ f }) {
  return (
    <div className="bg-white rounded-2xl p-7 text-center shadow-sm hover:shadow-xl transition-shadow duration-300 h-full">
      <span className="text-4xl block">{f.icon}</span>
      <h3 className="font-display font-semibold text-gray-800 mt-4 mb-2">{f.title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
    </div>
  );
}

export async function getServerSideProps({ req, query }) {
  const tenant = await getTenantFromRequest(req);
  if (!tenant) return { notFound: true };

  const categoryGroups = await getProductsByCategory(tenant.id);

  let settings = null;
  if (tenant.tenant_settings) {
    try {
      settings = typeof tenant.tenant_settings === 'string'
        ? JSON.parse(tenant.tenant_settings)
        : tenant.tenant_settings;
    } catch {}
  }

  return { props: { tenant, categoryGroups, settings } };
}
