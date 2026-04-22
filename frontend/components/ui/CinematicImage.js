import { useState, useRef, useEffect } from 'react';
import {
  m as motion,
  useInView, useMotionValue, useTransform, useSpring, AnimatePresence,
} from 'framer-motion';

export default function CinematicImage({
  src,
  alt,
  className       = '',
  containerClassName = '',
  tilt            = false,
  reveal          = 'scale',
  delay           = 0,
  priority        = false,
  fallback        = null,
  overlayClassName = '',
  hoverEffect     = 'zoom',   // 'zoom' | 'pan' | 'tilt3d' | 'reveal' | 'shine' | 'none'
}) {
  const [loaded,   setLoaded]   = useState(false);
  const [error,    setError]    = useState(false);
  const [visible,  setVisible]  = useState(priority);
  const [hovered,  setHovered]  = useState(false);

  const containerRef = useRef(null);
  const inView       = useInView(containerRef, { once: true, margin: '-10% 0px' });

  // Magnetic tilt values
  const mouseX  = useMotionValue(0.5);
  const mouseY  = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [6, -6]),  { stiffness: 200, damping: 25 });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-6, 6]), { stiffness: 200, damping: 25 });
  const shineX  = useTransform(mouseX, [0, 1], ['-100%', '200%']);
  const shineY  = useTransform(mouseY, [0, 1], ['-100%', '200%']);

  useEffect(() => { if (inView) setVisible(true); }, [inView]);

  const handleMouseMove = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top)  / rect.height;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
    setHovered(false);
  };

  // Entrance reveal
  const revealVariants = {
    hidden: {
      scale:   reveal === 'scale' ? 1.1  : 1,
      y:       reveal === 'slide-up'   ? 40 : 0,
      x:       reveal === 'slide-left' ? 40 : 0,
      opacity: 0,
      filter:  reveal === 'blur' ? 'blur(16px)' : 'blur(0px)',
    },
    visible: {
      scale: 1, y: 0, x: 0, opacity: 1, filter: 'blur(0px)',
      transition: { duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] },
    },
  };

  // Per-effect image motion props (no hooks inside — Rules of Hooks)
  const imageMotion = {
    zoom: {
      animate: hovered ? { scale: 1.12 } : { scale: 1 },
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
    tilt3d: {
      style: { rotateX, rotateY, scale: hovered ? 1.04 : 1 },
    },
    reveal: {
      animate: hovered ? { y: '-5%', scale: 1.08 } : { y: '0%', scale: 1 },
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
    shine: {
      animate: hovered ? { scale: 1.06 } : { scale: 1 },
      transition: { duration: 0.5, ease: 'easeOut' },
    },
    none: {},
  };

  const motion3dStyle = hoverEffect === 'tilt3d' && hovered
    ? { perspective: 800, rotateX, rotateY, transformStyle: 'preserve-3d' }
    : {};

  return (
    <motion.div
      ref={containerRef}
      className={`relative overflow-hidden ${containerClassName}`}
      style={motion3dStyle}
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

      {/* Image with cinematic entrance + hover effect */}
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
            {...(hoverEffect !== 'tilt3d' && hoverEffect !== 'none' ? {
              animate: imageMotion[hoverEffect]?.animate,
              transition: imageMotion[hoverEffect]?.transition,
            } : {})}
            style={{ willChange: 'transform', ...(imageMotion[hoverEffect]?.style || {}) }}
          />

          {/* Shine overlay */}
          {hoverEffect === 'shine' && hovered && (
            <motion.div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                background: `radial-gradient(circle at ${useTransform(mouseX, [0,1], ['0%','100%'])}px ${useTransform(mouseY, [0,1], ['0%','100%'])}px, rgba(255,255,255,0.25) 0%, transparent 60%)`,
              }}
            />
          )}

          {/* Reveal: dramatic bottom-to-top gradient reveal */}
          {hoverEffect === 'reveal' && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : '100%' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 50%)',
              }}
            />
          )}
        </motion.div>
      )}

      {/* Optional overlay */}
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
