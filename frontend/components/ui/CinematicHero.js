import { useRef, useState, useEffect, useCallback } from 'react';
import { m as motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { useTenant } from '../../context/TenantContext';

const EASE_EXPO = [0.16, 1, 0.3, 1];

const container = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const textReveal = {
  hidden:  { opacity: 0, y: 40, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0,  filter: 'blur(0px)', transition: { duration: 0.8, ease: EASE_EXPO } },
};

export default function CinematicHero({ hero = {} }) {
  const tenant    = useTenant();
  const heroRef   = useRef(null);

  // Build images list: merge images[] + legacy image_url
  const allImages = (() => {
    const arr = [];
    if (Array.isArray(hero.images) && hero.images.length) {
      hero.images.forEach(img => { if (img?.url) arr.push(img.url); });
    }
    if (hero.image_url && !arr.includes(hero.image_url)) arr.push(hero.image_url);
    return arr;
  })();

  const [activeIdx,  setActiveIdx]  = useState(0);
  const [direction,  setDirection]  = useState(1); // 1 = forward, -1 = backward

  // Auto-advance slideshow
  const advance = useCallback(() => {
    if (allImages.length < 2) return;
    setDirection(1);
    setActiveIdx(i => (i + 1) % allImages.length);
  }, [allImages.length]);

  useEffect(() => {
    if (allImages.length < 2) return;
    const id = setInterval(advance, 5000);
    return () => clearInterval(id);
  }, [advance, allImages.length]);


  const goTo = (idx) => {
    if (idx === activeIdx) return;
    setDirection(idx > activeIdx ? 1 : -1);
    setActiveIdx(idx);
  };

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const rawY  = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const rawOp = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const y       = useSpring(rawY,  { stiffness: 80, damping: 20 });
  const opacity = useSpring(rawOp, { stiffness: 80, damping: 20 });

  const heading      = hero.heading    || 'Handcrafted with\nLove & Butter';
  const subhead      = (hero.subheading || `From our oven to your table — baked fresh every morning at ${tenant?.name || 'our bakery'}.`).replace('{name}', tenant?.name || 'our bakery');
  const badge        = hero.badge      || 'Fresh Baked Daily';
  const ctaPrimary   = hero.cta_primary  || 'Explore Menu';
  const ctaWA        = hero.cta_whatsapp || 'Order via WhatsApp';
  const hasImages    = allImages.length > 0;
  const headingLines = heading.split('\n');

  const overlayEnabled = hasImages && (hero.overlay_enabled !== false);
  const intensityMap = {
    none:   { left: 0,    mid: 0,    bottom: 0    },
    light:  { left: 0.45, mid: 0.15, bottom: 0.25 },
    medium: { left: 0.72, mid: 0.30, bottom: 0.50 },
    strong: { left: 0.88, mid: 0.55, bottom: 0.70 },
  };
  const intensity = intensityMap[hero.overlay_intensity || 'medium'] || intensityMap.medium;
  const { left: oLeft, mid: oMid, bottom: oBottom } = intensity;

  const textCol  = hasImages ? 'text-white'    : 'text-gray-900';
  const subCol   = hasImages ? 'text-white/80' : 'text-gray-600';
  const badgeBg  = hasImages ? 'rgba(255,255,255,0.15)' : 'color-mix(in srgb, var(--tenant-primary) 12%, transparent)';
  const badgeBrd = hasImages ? 'rgba(255,255,255,0.3)'  : 'color-mix(in srgb, var(--tenant-primary) 30%, transparent)';
  const badgeTxt = hasImages ? '#ffffff' : 'var(--tenant-primary)';
  const statVal  = hasImages ? 'text-white'    : 'text-gray-900';
  const statLbl  = hasImages ? 'text-white/60' : 'text-gray-400';

  return (
    <section ref={heroRef}
      className={`relative flex items-center overflow-hidden ${hasImages ? 'bg-stone-950' : 'bg-stone-50'}`}
      style={{ marginTop: '136px', minHeight: 'calc(100vh - 136px)' }}>

      {/* ── Slideshow images — cinematic transitions, clickable ── */}
      {hasImages && (
        <motion.div className="absolute inset-0 cursor-pointer" style={{ y }}
          onClick={() => { window.location.href = '/products'; }}>
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={activeIdx}
              custom={direction}
              className="absolute inset-0"
              variants={{
                enter:  (d) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0, filter: 'brightness(0.6)' }),
                center: { x: 0, opacity: 1, filter: 'brightness(1)',
                  transition: { x: { duration: 0.9, ease: [0.16, 1, 0.3, 1] }, opacity: { duration: 0.4 }, filter: { duration: 0.9 } } },
                exit:   (d) => ({ x: d > 0 ? '-30%' : '30%', opacity: 0.3, filter: 'brightness(0.5)',
                  transition: { x: { duration: 0.9, ease: [0.16, 1, 0.3, 1] }, opacity: { duration: 0.4 } } }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <img
                src={allImages[activeIdx]}
                alt={tenant?.name}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </motion.div>
          </AnimatePresence>

          {/* Gradient overlays */}
          {overlayEnabled && (
            <>
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: `linear-gradient(135deg, rgba(0,0,0,${oLeft}) 0%, rgba(0,0,0,${oMid}) 50%, rgba(0,0,0,0.05) 100%)` }} />
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: `linear-gradient(to top, rgba(0,0,0,${oBottom}) 0%, transparent 50%)` }} />
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 30%)' }} />
            </>
          )}
        </motion.div>
      )}

      {/* ── Abstract bg (no images) ── */}
      {!hasImages && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 50%, color-mix(in srgb, var(--tenant-primary) 12%, transparent), transparent 65%)' }} />
          <motion.div className="absolute -top-1/4 -right-1/4 w-[60vw] h-[60vw] rounded-full opacity-[0.08]"
            style={{ background: 'var(--tenant-primary)' }}
/>
        </div>
      )}

      {/* Film grain */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{ backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundRepeat:'repeat', backgroundSize:'200px' }} />

      {/* ── Content ── */}
      {hero.show_text_content !== false && (
      <motion.div
        className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 w-full"
        style={{ opacity, paddingTop: 'clamp(48px, 6vh, 80px)', paddingBottom: 'clamp(48px, 6vh, 80px)' }}
      >
        <motion.div variants={container} initial="hidden" animate="visible" className="max-w-xl space-y-5 sm:space-y-6">

          {/* Badge */}
          <motion.div variants={textReveal}>
            <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border backdrop-blur-sm"
              style={{ backgroundColor: badgeBg, borderColor: badgeBrd, color: badgeTxt }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: badgeTxt }} />
              {badge}
            </span>
          </motion.div>

          {/* Heading */}
          {headingLines.map((line, i) => (
            <motion.div key={i} variants={textReveal} className="overflow-hidden leading-none">
              <h1 className={`font-display font-bold ${textCol}`}
                style={{ fontSize: 'clamp(2.6rem, 5vw, 4.5rem)', lineHeight: 1.06 }}>
                {i === headingLines.length - 1 && headingLines.length > 1
                  ? <span style={{ color: hasImages ? '#fff' : 'var(--tenant-primary)' }}>{line}</span>
                  : line}
              </h1>
            </motion.div>
          ))}

          {/* Subheading */}
          <motion.p variants={textReveal} className={`text-lg leading-relaxed max-w-lg ${subCol}`}>
            {subhead}
          </motion.p>

          {/* CTAs */}
          <motion.div variants={textReveal} className="flex flex-wrap gap-4 pt-2">
            <motion.a href="/products"
              className="inline-flex items-center gap-2.5 font-semibold px-8 py-4 rounded-full text-white shadow-lg"
              style={{ backgroundColor: 'var(--tenant-primary)' }}
              whileHover={{ scale:1.05, y:-3, boxShadow:'0 24px 48px -12px color-mix(in srgb, var(--tenant-primary) 55%, transparent)' }}
              whileTap={{ scale:0.97 }} transition={{ type:'spring', stiffness:400, damping:25 }}>
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
                  ${hasImages ? 'text-white border-white/35 hover:bg-white/10' : 'text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-white'}`}
                whileHover={{ scale:1.05, y:-3 }} whileTap={{ scale:0.97 }}
                transition={{ type:'spring', stiffness:400, damping:25 }}>
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
                  <p className={`text-xs mt-0.5 ${statLbl}`}>{s.label}</p>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      )}
      {/* ── Nav arrows + dots ── */}
      {allImages.length > 1 && (
        <>
          {/* Left arrow */}
          <button
            onClick={(e) => { e.stopPropagation(); setDirection(-1); setActiveIdx(i => (i - 1 + allImages.length) % allImages.length); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all"
            aria-label="Previous slide"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>

          {/* Right arrow */}
          <button
            onClick={(e) => { e.stopPropagation(); setDirection(1); setActiveIdx(i => (i + 1) % allImages.length); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all"
            aria-label="Next slide"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 pointer-events-none">
            {allImages.map((_, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); goTo(i); }}
                className="rounded-full transition-all duration-300 pointer-events-auto"
                style={{
                  width:           activeIdx === i ? '24px' : '8px',
                  height:          '8px',
                  backgroundColor: activeIdx === i ? '#fff' : 'rgba(255,255,255,0.45)',
                }}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Scroll indicator (single image or first slide) ── */}
      {allImages.length <= 1 && (
        <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.8, duration:0.6 }}>
          <p className={`text-[10px] font-medium tracking-[0.2em] uppercase ${hasImages ? 'text-white/50' : 'text-gray-400'}`}>Scroll</p>
          <motion.div className={`w-px h-10 origin-top ${hasImages ? 'bg-white/30' : 'bg-gray-300'}`}
            style={{ scaleY: useTransform(scrollYProgress, [0, 0.15], [1, 0]) }} />
        </motion.div>
      )}
    </section>
  );
}
