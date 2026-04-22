import { useRef, useState } from 'react';
import { m as motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useTenant } from '../../context/TenantContext';

const EASE_EXPO = [0.16, 1, 0.3, 1];

const container = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const textReveal = {
  hidden:  { opacity: 0, y: 40, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0,  filter: 'blur(0px)',
    transition: { duration: 0.8, ease: EASE_EXPO } },
};

export default function CinematicHero({ hero = {} }) {
  const tenant     = useTenant();
  const heroRef    = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const rawY  = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const rawOp = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const y       = useSpring(rawY,  { stiffness: 80, damping: 20 });
  const opacity = useSpring(rawOp, { stiffness: 80, damping: 20 });

  const heading      = hero.heading    || 'Handcrafted with\nLove & Butter';
  const subhead      = hero.subheading || `From our oven to your table — baked fresh every morning at ${tenant?.name || 'our bakery'}.`;
  const badge        = hero.badge      || 'Fresh Baked Daily';
  const ctaPrimary   = hero.cta_primary  || 'Explore Menu';
  const ctaWA        = hero.cta_whatsapp || 'Order via WhatsApp';
  const hasHeroImg   = !!hero.image_url;
  const headingLines = heading.split('\n');

  // Colour scheme: dark overlay → white text. No image → dark text on light bg
  const textCol     = hasHeroImg ? 'text-white'      : 'text-gray-900';
  const subCol      = hasHeroImg ? 'text-white/80'   : 'text-gray-600';
  const statVal     = hasHeroImg ? 'text-white'      : 'text-gray-900';
  const statLabel   = hasHeroImg ? 'text-white/60'   : 'text-gray-400';
  const scrollCol   = hasHeroImg ? 'text-white/50'   : 'text-gray-400';
  const scrollLine  = hasHeroImg ? 'bg-white/30'     : 'bg-gray-300';
  const badgeBg     = hasHeroImg
    ? 'rgba(255,255,255,0.15)'
    : 'color-mix(in srgb, var(--tenant-primary) 12%, transparent)';
  const badgeBorder = hasHeroImg
    ? 'rgba(255,255,255,0.3)'
    : 'color-mix(in srgb, var(--tenant-primary) 30%, transparent)';
  const badgeText   = hasHeroImg ? '#ffffff' : 'var(--tenant-primary)';

  return (
    <section ref={heroRef} className={`relative min-h-screen flex items-center overflow-hidden ${hasHeroImg ? 'bg-stone-950' : 'bg-stone-50'}`}>

      {/* ── Hero image with Ken Burns ── */}
      {hasHeroImg && (
        <motion.div className="absolute inset-0" style={{ y }}>
          <motion.img
            src={hero.image_url}
            alt={tenant?.name}
            className="w-full h-full object-cover"
            animate={{ scale: [1, 1.07, 1] }}
            transition={{ duration: 14, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' }}
            onLoad={() => setImgLoaded(true)}
          />
          {/* Gradient: left-heavy for text legibility */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.08) 100%)' }} />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)' }} />
        </motion.div>
      )}

      {/* ── Abstract bg (no image) ── */}
      {!hasHeroImg && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at 20% 50%, color-mix(in srgb, var(--tenant-primary) 12%, transparent), transparent 65%)' }} />
          <motion.div
            className="absolute -top-1/4 -right-1/4 w-[60vw] h-[60vw] rounded-full opacity-[0.08]"
            style={{ background: 'var(--tenant-primary)' }}
            animate={{ scale:[1,1.1,1], rotate:[0,8,0] }}
            transition={{ duration:18, repeat:Infinity, ease:'easeInOut' }} />
        </div>
      )}

      {/* Film grain */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{ backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundRepeat:'repeat', backgroundSize:'200px' }} />

      {/* ── Content ── */}
      <motion.div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 py-32 w-full" style={{ opacity }}>
        <motion.div variants={container} initial="hidden" animate="visible" className="max-w-2xl space-y-6">

          {/* Badge */}
          <motion.div variants={textReveal}>
            <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border backdrop-blur-sm"
              style={{ backgroundColor: badgeBg, borderColor: badgeBorder, color: badgeText }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: badgeText }} />
              {badge}
            </span>
          </motion.div>

          {/* Heading */}
          {headingLines.map((line, i) => (
            <motion.div key={i} variants={textReveal} className="overflow-hidden leading-none">
              <h1 className={`font-display font-bold ${textCol}`}
                style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)', lineHeight: 1.08 }}>
                {i === headingLines.length - 1 && headingLines.length > 1
                  ? <span style={{ color: hasHeroImg ? '#fff' : 'var(--tenant-primary)' }}>{line}</span>
                  : line}
              </h1>
            </motion.div>
          ))}

          {/* Subheading */}
          <motion.p variants={textReveal} className={`text-lg leading-relaxed max-w-lg ${subCol}`}>
            {subhead.replace('{name}', tenant?.name || 'our bakery')}
          </motion.p>

          {/* CTAs */}
          <motion.div variants={textReveal} className="flex flex-wrap gap-4 pt-2">
            <motion.a href="/products"
              className="inline-flex items-center gap-2.5 font-semibold px-8 py-4 rounded-full text-white shadow-lg"
              style={{ backgroundColor: 'var(--tenant-primary)' }}
              whileHover={{ scale:1.05, y:-3, boxShadow:'0 24px 48px -12px color-mix(in srgb, var(--tenant-primary) 55%, transparent)' }}
              whileTap={{ scale:0.97 }}
              transition={{ type:'spring', stiffness:400, damping:25 }}>
              {ctaPrimary}
              <motion.svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                animate={{ x:[0,4,0] }} transition={{ duration:1.6, repeat:Infinity, ease:'easeInOut' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </motion.svg>
            </motion.a>

            {tenant?.whatsapp_number && (
              <motion.a href={`https://wa.me/${tenant.whatsapp_number}?text=${encodeURIComponent("Hi! I would like to place an order at " + (tenant.name || "your store") + ". Please share the menu and availability. Thank you!")}`}
                target="_blank" rel="noopener noreferrer"
                className={`inline-flex items-center gap-2.5 font-semibold px-8 py-4 rounded-full border-2 backdrop-blur-sm transition-colors
                  ${hasHeroImg ? 'text-white border-white/35 hover:bg-white/10' : 'text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-white'}`}
                whileHover={{ scale:1.05, y:-3 }}
                whileTap={{ scale:0.97 }}
                transition={{ type:'spring', stiffness:400, damping:25 }}>
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#25D366]">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {ctaWA}
              </motion.a>
            )}
          </motion.div>

          {/* Stats */}
          {hero.stats?.length > 0 && (
            <motion.div variants={textReveal} className="flex items-center gap-8 pt-4">
              {hero.stats.map((s, i) => (
                <div key={i} className="text-center">
                  <p className={`text-2xl font-display font-bold ${statVal}`}>{s.value}</p>
                  <p className={`text-xs mt-0.5 ${statLabel}`}>{s.label}</p>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.8, duration:0.6 }}>
        <p className={`text-[10px] font-medium tracking-[0.2em] uppercase ${scrollCol}`}>Scroll</p>
        <motion.div className={`w-px h-10 origin-top ${scrollLine}`}
          style={{ scaleY: useTransform(scrollYProgress, [0, 0.15], [1, 0]) }} />
      </motion.div>
    </section>
  );
}
