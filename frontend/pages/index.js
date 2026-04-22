import { m as motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import CinematicHero from '../components/ui/CinematicHero';
import Layout from '../components/layout/Layout';
import ProductCard from '../components/ui/ProductCard';
import MetaTags from '../components/seo/MetaTags';

const SwiperCarousel = dynamic(() => import('../components/ui/SwiperCarousel'), { ssr: false });

const { homeSeo }               = require('../lib/seo');
const { getTenantFromRequest, getFeaturedProducts } = require('../lib/prefetch');

const DEFAULT_FEATURES = [
  { icon: '🌾', title: 'Real Ingredients',  desc: 'No preservatives, no shortcuts. Every recipe uses premium, natural ingredients.' },
  { icon: '⏰', title: 'Baked Fresh Daily', desc: 'Everything is baked fresh every morning. We never sell day-old products.' },
  { icon: '🚚', title: 'Same-Day Delivery', desc: 'Order before noon and get delivery by evening within the city.' },
];

export default function HomePage({ tenant, featuredProducts, settings }) {
  const seo   = homeSeo(tenant);
  const feats = settings?.features?.length ? settings.features : DEFAULT_FEATURES;

  return (
    <>
      <MetaTags seo={seo} tenant={tenant} />
      <Layout tenant={tenant} settings={settings}>

        {/* ── Cinematic Hero ── */}
        <CinematicHero hero={settings?.hero} settings={settings} />

        {/* ── Featured Products ── */}
        {featuredProducts.length > 0 && (
          <section className="py-24 overflow-hidden">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.6 }}
                className="text-center mb-12"
              >
                <p className="text-sm font-semibold tracking-widest uppercase mb-2"
                  style={{ color: 'var(--tenant-primary)' }}>This Week's Picks</p>
                <h2 className="font-display text-4xl text-gray-900">Fresh From the Oven</h2>
              </motion.div>

              {/* Swiper on all screen sizes */}
              <SwiperCarousel
                slidesPerView={1.2}
                spaceBetween={16}
                navigation={true}
                pagination={true}
                breakpoints={{
                  480:  { slidesPerView: 2,   spaceBetween: 16 },
                  768:  { slidesPerView: 3,   spaceBetween: 20 },
                  1024: { slidesPerView: 4,   spaceBetween: 24 },
                }}
              >
                {featuredProducts.map((p, i) => (
                  <div key={p.id}>
                    <ProductCard product={p} index={i} />
                  </div>
                ))}
              </SwiperCarousel>

              <motion.div
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                viewport={{ once: true }} className="text-center mt-10"
              >
                <motion.a href="/products"
                  className="inline-flex items-center gap-2 border font-semibold px-7 py-3 rounded-full transition-all duration-200"
                  style={{ borderColor: 'var(--tenant-primary)', color: 'var(--tenant-primary)' }}
                  whileHover={{ scale: 1.04, y: -2, backgroundColor: 'var(--tenant-primary)', color: '#fff' }}
                  whileTap={{ scale: 0.97 }}
                >
                  View Full Menu
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.a>
              </motion.div>
            </div>
          </section>
        )}

        {/* ── Features — swiper on mobile ── */}
        {feats.length > 0 && (
          <section className="bg-stone-50 py-20 overflow-hidden">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <motion.h2
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.6 }}
                className="font-display text-3xl text-center text-gray-900 mb-10"
              >
                Why Choose {tenant.name}
              </motion.h2>

              {/* Mobile swiper / desktop grid */}
              <div className="block sm:hidden">
                <SwiperCarousel
                  slidesPerView={1.1}
                  spaceBetween={12}
                  pagination={true}
                  centeredSlides={true}
                >
                  {feats.map((f, i) => (
                    <div key={i}>
                      <FeatureCard f={f} />
                    </div>
                  ))}
                </SwiperCarousel>
              </div>

              <div className="hidden sm:grid sm:grid-cols-3 gap-8">
                {feats.map((f, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.6 }}
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

export async function getServerSideProps({ req }) {
  const tenant = await getTenantFromRequest(req);
  if (!tenant) return { notFound: true };
  const featuredProducts = await getFeaturedProducts(tenant.id, 8);
  let settings = null;
  if (tenant.tenant_settings) {
    try {
      settings = typeof tenant.tenant_settings === 'string'
        ? JSON.parse(tenant.tenant_settings)
        : tenant.tenant_settings;
    } catch {}
  }
  return { props: { tenant, featuredProducts, settings } };
}
