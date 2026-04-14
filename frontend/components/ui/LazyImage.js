import { useState, useRef, useEffect } from 'react';
export default function LazyImage({ src, alt, className = '', skeletonClassName = '', rootMargin = '200px', ...props }) {
  const [loaded,  setLoaded]  = useState(false);
  const [visible, setVisible] = useState(false);
  const [error,   setError]   = useState(false);
  const imgRef = useRef(null);
  useEffect(() => {
    if (!src) return;
    if (!window.IntersectionObserver) { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } }, { rootMargin });
    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [src, rootMargin]);
  return (
    <div ref={imgRef} className={`relative overflow-hidden ${skeletonClassName}`} {...props}>
      {!loaded && !error && <div className="absolute inset-0 bg-stone-100 animate-pulse" />}
      {error && <div className="absolute inset-0 bg-stone-100 flex items-center justify-center text-4xl opacity-20">🎂</div>}
      {visible && src && <img src={src} alt={alt} onLoad={() => setLoaded(true)} onError={() => setError(true)} className={`transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`} />}
    </div>
  );
}
