import { m as motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import ProductCard from '../components/ui/ProductCard';
import MetaTags from '../components/seo/MetaTags';
const { homeSeo }               = require('../lib/seo');
const { getTenantFromRequest, getFeaturedProducts } = require('../lib/prefetch');

const DEFAULT = {
  hero: {
    badge:        'Fresh Baked Daily',
    heading:      'Handcrafted with\nLove & Butter',
    subheading:   "From our oven to your table — every cake, croissant and pastry is baked fresh each morning.",
    cta_primary:  'Explore Menu',
    cta_whatsapp: 'Order via WhatsApp',
    image_url:    '',
    stats: [
      { value: '500+', label: 'Happy customers' },
      { value: '50+',  label: 'Menu items'      },
      { value: '100%', label: 'Fresh daily'      },
    ],
  },
  features: [
    { icon: '🌾', title: 'Real Ingredients',  desc: 'No preservatives, no shortcuts. Every recipe uses premium, natural ingredients.' },
    { icon: '⏰', title: 'Baked Fresh Daily', desc: 'Everything is baked fresh every morning. We never sell day-old products.' },
    { icon: '🚚', title: 'Same-Day Delivery', desc: 'Order before noon and get delivery by evening within the city.' },
  ],
};

export default function HomePage({ tenant, featuredProducts, settings }) {
  const seo    = homeSeo(tenant);
  const hero   = settings?.hero     || DEFAULT.hero;
  const feats  = (settings?.features?.length ? settings.features : DEFAULT.features);

  return (
    <>
      <MetaTags seo={seo} tenant={tenant} />
      <Layout tenant={tenant} settings={settings}>
        {/* ── Hero ─────────────────────────────────────── */}
        <section className="relative min-h-screen flex items-center overflow-hidden bg-stone-50">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div animate={{ scale:[1,1.08,1], rotate:[0,5,0] }} transition={{ duration:14, repeat:Infinity, ease:'easeInOut' }}
              className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-[0.07]"
              style={{ background:'var(--tenant-primary)' }} />
          </div>

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-32 grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.1 }}
                className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ backgroundColor:'color-mix(in srgb, var(--tenant-primary) 10%, transparent)', color:'var(--tenant-primary)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor:'var(--tenant-primary)' }} />
                {hero.badge}
              </motion.div>

              <motion.h1 initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}
                className="font-display text-5xl sm:text-6xl leading-[1.1] text-gray-900">
                {hero.heading.split('\n').map((line, i) => (
                  <span key={i}>{i > 0 ? <><br /><span style={{ color:'var(--tenant-primary)' }}>{line}</span></> : line}</span>
                ))}
              </motion.h1>

              <motion.p initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
                className="text-gray-500 text-lg leading-relaxed max-w-md">
                {hero.subheading.replace('{name}', tenant?.name || 'our bakery')}
              </motion.p>

              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.55 }} className="flex flex-wrap gap-4">
                <a href="/products" className="text-white font-semibold px-7 py-3.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ backgroundColor:'var(--tenant-primary)' }}>
                  {hero.cta_primary}
                </a>
                {tenant?.whatsapp_number && (
                  <a href={`https://wa.me/${tenant.whatsapp_number}`} target="_blank" rel="noopener noreferrer"
                    className="border border-gray-200 text-gray-700 font-semibold px-7 py-3.5 rounded-full hover:-translate-y-0.5 transition-all duration-200">
                    {hero.cta_whatsapp}
                  </a>
                )}
              </motion.div>

              {hero.stats?.length > 0 && (
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.7 }} className="flex items-center gap-6 pt-2">
                  {hero.stats.map(s => (
                    <div key={s.label}>
                      <p className="text-xl font-display font-bold text-gray-900">{s.value}</p>
                      <p className="text-xs text-gray-400">{s.label}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Hero image or default emoji */}
            <motion.div initial={{ opacity:0, x:40 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.9, delay:0.3 }}
              className="hidden md:flex justify-center items-center relative">
              {hero.image_url ? (
                <img src={hero.image_url} alt={tenant?.name} className="w-full max-w-sm rounded-3xl object-cover shadow-2xl aspect-square" />
              ) : (
                <div className="w-72 h-72 rounded-full flex items-center justify-center" style={{ background:'color-mix(in srgb, var(--tenant-primary) 12%, transparent)' }}>
                  <motion.div animate={{ y:[0,-12,0] }} transition={{ duration:4, repeat:Infinity, ease:'easeInOut' }} className="text-center space-y-2">
                    <span className="text-7xl">🎂</span>
                    <p className="font-display font-semibold text-gray-800">{tenant?.name || 'Our Bakery'}</p>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* ── Featured Products ─────────────────────────── */}
        {featuredProducts.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 py-24">
            <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center mb-12">
              <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color:'var(--tenant-primary)' }}>This Week's Picks</p>
              <h2 className="font-display text-4xl text-gray-900">Fresh From the Oven</h2>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }} className="text-center mt-12">
              <a href="/products" className="inline-flex items-center gap-2 border font-semibold px-7 py-3 rounded-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:text-white"
                style={{ borderColor:'var(--tenant-primary)', color:'var(--tenant-primary)' }}
                onMouseEnter={e=>{ e.currentTarget.style.backgroundColor='var(--tenant-primary)'; e.currentTarget.style.color='#fff'; }}
                onMouseLeave={e=>{ e.currentTarget.style.backgroundColor=''; e.currentTarget.style.color='var(--tenant-primary)'; }}>
                View Full Menu
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </a>
            </motion.div>
          </section>
        )}

        {/* ── Features ─────────────────────────────────── */}
        {feats.length > 0 && (
          <section className="bg-stone-50 py-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <motion.h2 initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
                className="font-display text-3xl text-center text-gray-900 mb-12">
                Why Choose {tenant.name}
              </motion.h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {feats.map((f, i) => (
                  <motion.div key={i} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*0.1 }}
                    className="bg-white rounded-2xl p-7 text-center shadow-sm">
                    <span className="text-4xl">{f.icon}</span>
                    <h3 className="font-display font-semibold text-gray-800 mt-4 mb-2">{f.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
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

export async function getServerSideProps({ req }) {
  const tenant = await getTenantFromRequest(req);
  if (!tenant) return { notFound: true };
  const featuredProducts = await getFeaturedProducts(tenant.id, 8);
  // Parse tenant_settings if present
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
