import { useState, useRef, useEffect } from 'react';
import { m as motion, useInView, useMotionValue, useTransform, useSpring } from 'framer-motion';

/**
 * CinematicImage — high-quality cinematic image component with:
 * - Parallax scroll effect (subtle depth)
 * - Blur-to-sharp reveal on load (like film developing)
 * - Scale reveal when entering viewport
 * - Magnetic hover tilt (3D perspective)
 * - Shimmer skeleton while loading
 * - Smooth error fallback
 */
export default function CinematicImage({
  src,
  alt,
  className = '',
  containerClassName = '',
  parallax = false,
  tilt = false,
  reveal = 'scale',      // 'scale' | 'slide-up' | 'slide-left' | 'fade' | 'blur'
  delay = 0,
  priority = false,
  fallback = null,       // JSX to render if no src
  overlayClassName = '',
}) {
  const [loaded,  setLoaded]  = useState(false);
  const [error,   setError]   = useState(false);
  const [visible, setVisible] = useState(priority);

  const containerRef = useRef(null);
  const inView       = useInView(containerRef, { once: true, margin: '-10% 0px' });

  // Tilt (3D magnetic hover)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]),  { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 });

  useEffect(() => { if (inView) setVisible(true); }, [inView]);

  const handleMouseMove = (e) => {
    if (!tilt) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width  - 0.5);
    mouseY.set((e.clientY - rect.top)  / rect.height - 0.5);
  };
  const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

  // Reveal animation variants
  const revealVariants = {
    hidden: {
      scale:   reveal === 'scale'      ? 1.08 : 1,
      y:       reveal === 'slide-up'   ? 40   : 0,
      x:       reveal === 'slide-left' ? 40   : 0,
      opacity: 0,
      filter:  reveal === 'blur'       ? 'blur(20px)' : 'blur(0px)',
    },
    visible: {
      scale:   1,
      y:       0,
      x:       0,
      opacity: 1,
      filter:  'blur(0px)',
      transition: {
        duration: 0.9,
        delay,
        ease:     [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <motion.div
      ref={containerRef}
      className={`relative overflow-hidden ${containerClassName}`}
      style={tilt ? { perspective: 1000, rotateX, rotateY, transformStyle: 'preserve-3d' } : {}}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Shimmer skeleton */}
      {!loaded && !error && (
        <div className="absolute inset-0 overflow-hidden bg-stone-100">
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
            }}
            animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      )}

      {/* Main image with cinematic reveal */}
      {visible && src && !error && (
        <motion.div
          className="w-full h-full"
          variants={revealVariants}
          initial="hidden"
          animate={loaded ? 'visible' : 'hidden'}
        >
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover ${className}`}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            style={{ willChange: 'transform' }}
          />
        </motion.div>
      )}

      {/* Optional overlay */}
      {overlayClassName && loaded && (
        <div className={`absolute inset-0 pointer-events-none ${overlayClassName}`} />
      )}

      {/* Error / fallback */}
      {(error || (!src && !fallback)) && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-100 text-stone-300">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      {!src && fallback && fallback}
    </motion.div>
  );
}
