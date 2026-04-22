import { useRef, useState, useEffect, useCallback } from 'react';
import { m as motion } from 'framer-motion';

/**
 * CSS Scroll-Snap Carousel — no external dependencies.
 * Touch swipe + mouse drag + prev/next arrows + dot pagination.
 */
export default function SwiperCarousel({
  children,
  slidesPerView   = 1,
  spaceBetween    = 16,
  navigation      = false,
  pagination      = false,
  breakpoints,
  className       = '',
}) {
  const trackRef    = useRef(null);
  const [current,   setCurrent]   = useState(0);
  const [perView,   setPerView]   = useState(slidesPerView);
  const [total,     setTotal]     = useState(0);

  const items = Array.isArray(children) ? children : [children];

  // Responsive perView from breakpoints
  useEffect(() => {
    if (!breakpoints) return;
    const update = () => {
      const w = window.innerWidth;
      const bps = Object.entries(breakpoints)
        .map(([k, v]) => [parseInt(k), v])
        .sort((a, b) => b[0] - a[0]);
      for (const [bp, val] of bps) {
        if (w >= bp) { setPerView(val.slidesPerView ?? slidesPerView); return; }
      }
      setPerView(slidesPerView);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [breakpoints, slidesPerView]);

  useEffect(() => {
    setTotal(Math.max(0, items.length - Math.floor(perView)));
  }, [items.length, perView]);

  const scrollTo = useCallback((idx) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(idx, total));
    const slideW  = track.scrollWidth / items.length;
    track.scrollTo({ left: slideW * clamped, behavior: 'smooth' });
    setCurrent(clamped);
  }, [items.length, total]);

  // Sync dot on scroll
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      const slideW = track.scrollWidth / items.length;
      if (slideW > 0) setCurrent(Math.round(track.scrollLeft / slideW));
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, [items.length]);

  const dotCount = total + 1;

  return (
    <div className={`relative ${className}`}>
      {/* Track */}
      <div
        ref={trackRef}
        className="flex overflow-x-auto scrollbar-hide items-stretch"
        style={{
          scrollSnapType:    'x mandatory',
          gap:               `${spaceBetween}px`,
          paddingBottom:     pagination ? '32px' : '0',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {items.map((child, i) => (
          <div
            key={i}
            style={{
              scrollSnapAlign: 'start',
              flex:             `0 0 calc((100% - ${(Math.floor(perView) - 1) * spaceBetween}px) / ${perView})`,
              minWidth:         0,
              display:          'flex',
              flexDirection:    'column',
            }}
          >
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{child}</div>
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      {navigation && total > 0 && (
        <>
          <button
            onClick={() => scrollTo(current - 1)}
            disabled={current === 0}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center disabled:opacity-30 hover:shadow-lg transition-all"
            aria-label="Previous"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scrollTo(current + 1)}
            disabled={current >= total}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center disabled:opacity-30 hover:shadow-lg transition-all"
            aria-label="Next"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dot pagination */}
      {pagination && dotCount > 1 && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-1.5">
          {Array.from({ length: dotCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width:           current === i ? '20px' : '6px',
                height:          '6px',
                backgroundColor: current === i ? 'var(--tenant-primary)' : 'rgba(0,0,0,0.2)',
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Named export for compatibility
export function SwiperSlide({ children, className = '' }) {
  return <div className={`h-full ${className}`}>{children}</div>;
}
