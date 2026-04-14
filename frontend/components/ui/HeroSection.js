import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTenant } from '../../context/TenantContext';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] } }) };

export default function HeroSection() {
  const tenant = useTenant();
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-stone-50">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div animate={{ scale: [1, 1.08, 1], rotate: [0, 5, 0] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-[0.07]" style={{ background: 'var(--tenant-primary)' }} />
      </div>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-32 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.1} className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--tenant-primary) 10%, transparent)', color: 'var(--tenant-primary)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--tenant-primary)' }} />
            Fresh Baked Daily
          </motion.div>
          <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={0.25} className="font-display text-5xl sm:text-6xl leading-[1.1] text-gray-900 text-balance">
            Handcrafted with<br /><span style={{ color: 'var(--tenant-primary)' }}>Love & Butter</span>
          </motion.h1>
          <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={0.4} className="text-gray-500 text-lg leading-relaxed max-w-md">
            From our oven to your table — every cake, croissant and pastry at <strong className="text-gray-700">{tenant?.name || 'our bakery'}</strong> is baked fresh each morning.
          </motion.p>
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.55} className="flex flex-wrap gap-4">
            <Link href="/products" className="text-white font-semibold px-7 py-3.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg" style={{ backgroundColor: 'var(--tenant-primary)' }}>Explore Menu</Link>
            {tenant?.whatsapp_number && <a href={`https://wa.me/${tenant.whatsapp_number}`} target="_blank" rel="noopener noreferrer" className="border border-gray-200 text-gray-700 font-semibold px-7 py-3.5 rounded-full hover:-translate-y-0.5 transition-all duration-200">Order via WhatsApp</a>}
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.7} className="flex items-center gap-6 pt-2">
            {[{ value: '500+', label: 'Happy customers' }, { value: '50+', label: 'Menu items' }, { value: '100%', label: 'Fresh daily' }].map(b => (
              <div key={b.label}><p className="text-xl font-display font-bold text-gray-900">{b.value}</p><p className="text-xs text-gray-400">{b.label}</p></div>
            ))}
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, delay: 0.3 }} className="hidden md:flex justify-center items-center relative">
          <div className="w-72 h-72 rounded-full flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--tenant-primary) 12%, transparent)' }}>
            <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="text-center space-y-2">
              <span className="text-7xl">🎂</span>
              <p className="font-display font-semibold text-gray-800">{tenant?.name || 'Our Bakery'}</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
