import { useState, useRef, useEffect } from 'react';
import { m as motion, useInView, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';

export default function CinematicImage({
  src,
  alt,
  className        = '',
  containerClassName = '',
  tilt             = false,
  reveal           = 'scale',
  delay            = 0,
  priority         = false,
  fallback         = null,
  overlayClassName = '',
  hoverEffect      = 'zoom',
}) {
  const [loaded,  setLoaded]  = useState(false);
  const [error,   setError]   = useState(false);
  const [visible, setVisible] = useState(priority);
  const [hovered, setHovered] = useState(false);

  const containerRef = useRef(null);
  const inView       = useInView(containerRef, { once: true, margin: '-10% 0px' });

  // All motion values at top level — never inside conditions or objects
  const mouseX  = useMotionValue(0.5);
  const mouseY  = useMotionValue(0.5);
  const rotateX = useSpring(0, { stiffness: 200, damping: 25 });
  const rotateY = useSpring(0, { stiffness: 200, damping: 25 });

  useEffect(() => { if (inView) setVisible(true); }, [inView]);

  const handleMouseMove = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top)  / rect.height;
    mouseX.set(x);
    mouseY.set(y);
    // tilt3d: update springs directly
    if (hoverEffect === 'tilt3d') {
      rotateX.set((y - 0.5) * -10);
      rotateY.set((x - 0.5) *  10);
    }
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5); mouseY.set(0.5);
    rotateX.set(0);  rotateY.set(0);
    setHovered(false);
  };

  // Entrance reveal variants
  const revealVariants = {
    hidden: {
      scale:   reveal === 'scale'      ? 1.1  : 1,
      y:       reveal === 'slide-up'   ? 40   : 0,
      x:       reveal === 'slide-left' ? 40   : 0,
      opacity: 0,
      filter:  reveal === 'blur'       ? 'blur(16px)' : 'blur(0px)',
    },
    visible: {
      scale: 1, y: 0, x: 0, opacity: 1, filter: 'blur(0px)',
      transition: { duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] },
    },
  };

  // Hover animation — computed from plain values, no hooks
  const getHoverAnimate = () => {
    if (!hovered) return { scale: 1, y: 0 };
    switch (hoverEffect) {
      case 'zoom':   return { scale: 1.12 };
      case 'reveal': return { scale: 1.08, y: '-4%' };
      case 'shine':  return { scale: 1.06 };
      default:       return { scale: 1 };
    }
  };
  const getHoverTransition = () => ({
    duration: hoverEffect === 'zoom' ? 0.6 : 0.45,
    ease: [0.16, 1, 0.3, 1],
  });

  const tilt3dStyle = hoverEffect === 'tilt3d'
    ? { rotateX, rotateY, scale: hovered ? 1.04 : 1 }
    : {};

  return (
    <motion.div
      ref={containerRef}
      className={`relative overflow-hidden ${containerClassName}`}
      style={hoverEffect === 'tilt3d' ? { perspective: 800 } : {}}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Shimmer skeleton */}
      <AnimatePresence>
        {!loaded && !error && (
          <motion.div
            key="shimmer"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 overflow-hidden bg-stone-100 z-10"
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)',
                backgroundSize: '300% 100%',
              }}
              animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image with entrance reveal + hover effect */}
      {visible && src && !error && (
        <motion.div
          className="w-full h-full"
          variants={revealVariants}
          initial="hidden"
          animate={loaded ? 'visible' : 'hidden'}
        >
          <motion.img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover ${className}`}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            animate={hoverEffect !== 'tilt3d' ? getHoverAnimate() : undefined}
            transition={hoverEffect !== 'tilt3d' ? getHoverTransition() : undefined}
            style={{ willChange: 'transform', ...tilt3dStyle }}
          />

          {/* Shine overlay — CSS only, no hooks */}
          {hoverEffect === 'shine' && hovered && (
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                background: `radial-gradient(circle at ${Math.round(mouseX.get() * 100)}% ${Math.round(mouseY.get() * 100)}%, rgba(255,255,255,0.22) 0%, transparent 55%)`,
              }}
            />
          )}

          {/* Reveal gradient */}
          {hoverEffect === 'reveal' && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ opacity: hovered ? 1 : 0 }}
              transition={{ duration: 0.35 }}
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)' }}
            />
          )}
        </motion.div>
      )}

      {/* Overlay */}
      {overlayClassName && loaded && (
        <div className={`absolute inset-0 pointer-events-none ${overlayClassName}`} />
      )}

      {/* Fallback */}
      {(error || (!src && !fallback)) && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-100 text-stone-300">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
      )}
      {!src && fallback && fallback}
    </motion.div>
  );
}
