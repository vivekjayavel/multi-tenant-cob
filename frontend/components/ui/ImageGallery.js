import { useState, useEffect, useCallback } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';

export default function ImageGallery({ images, alt, onClose }) {
  const [activeIdx, setActiveIdx] = useState(0);

  const goNext = useCallback(() => setActiveIdx(i => (i + 1) % images.length), [images.length]);
  const goPrev = useCallback(() => setActiveIdx(i => (i - 1 + images.length) % images.length), [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft')  goPrev();
      if (e.key === 'Escape')     onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Close button */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 flex-shrink-0"
        onClick={e => e.stopPropagation()}>
        <p className="text-white/60 text-sm truncate max-w-xs">{alt}</p>
        <button onClick={onClose}
          className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Main image */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-16 relative min-h-0"
        onClick={e => e.stopPropagation()}>
        <AnimatePresence mode="wait">
          <motion.img
            key={activeIdx}
            src={images[activeIdx]}
            alt={`${alt} ${activeIdx + 1}`}
            className="max-h-full max-w-full object-contain rounded-2xl select-none"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            draggable={false}
          />
        </AnimatePresence>

        {/* Prev / Next arrows */}
        {images.length > 1 && (
          <>
            <button onClick={goPrev}
              className="absolute left-2 sm:left-4 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-colors backdrop-blur-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <button onClick={goNext}
              className="absolute right-2 sm:right-4 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-colors backdrop-blur-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-4"
          onClick={e => e.stopPropagation()}>
          {images.map((img, i) => (
            <button key={i} onClick={() => setActiveIdx(i)}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden flex-shrink-0 transition-all border-2 ${
                activeIdx === i ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-80'
              }`}>
              <img src={img} alt={`${alt} thumbnail ${i+1}`} className="w-full h-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}

      {/* Counter */}
      {images.length > 1 && (
        <p className="text-center text-white/40 text-xs pb-4 flex-shrink-0">
          {activeIdx + 1} / {images.length}
        </p>
      )}
    </motion.div>
  );
}
