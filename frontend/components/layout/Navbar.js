import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { m as motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import CartDrawer from '../ui/CartDrawer';
import { useTenant } from '../../context/TenantContext';

export default function Navbar({ tenant: tenantProp }) {
  const tenant = useTenant() || tenantProp || {};
  const [scrolled,   setScrolled]   = useState(false);
  const [cartOpen,   setCartOpen]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount, hydrated } = useCart();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { setMobileOpen(false); }, [router.pathname]);

  const isTransparent = !scrolled && router.pathname === '/';

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm py-3'
          : isTransparent
            ? 'bg-transparent py-5'
            : 'bg-white/95 backdrop-blur-md shadow-sm py-3'
      }`}>
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">

          {/* ── Logo / Brand ── */}
          <Link href="/" className="flex items-center gap-2 group">
            {tenant?.logo_url ? (
              <motion.img
                src={tenant.logo_url}
                alt={tenant.name || 'Bakery'}
                className="h-10 w-auto object-contain transition-all duration-300"
                whileHover={{ scale: 1.04 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            ) : (
              <motion.span
                className="font-display text-xl font-bold"
                style={{ color: isTransparent ? '#fff' : 'var(--tenant-primary)' }}
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                {tenant?.name || 'Bakery'}
              </motion.span>
            )}
          </Link>

          {/* ── Desktop nav ── */}
          <div className="hidden md:flex items-center gap-8">
            {[['/', 'Home'], ['/products', 'Menu']].map(([href, label]) => (
              <Link key={href} href={href}
                className={`text-sm font-medium transition-colors ${
                  router.pathname === href
                    ? ''
                    : isTransparent ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
                style={router.pathname === href ? { color: isTransparent ? '#fff' : 'var(--tenant-primary)' } : {}}>
                {label}
              </Link>
            ))}
          </div>

          {/* ── Cart + hamburger ── */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCartOpen(true)}
              className={`relative p-2 rounded-full transition-colors ${
                isTransparent ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-700'
              }`}
              aria-label="Open cart"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {hydrated && itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--tenant-primary)' }}
                >
                  {itemCount > 9 ? '9+' : itemCount}
                </motion.span>
              )}
            </button>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`md:hidden p-2 rounded-full transition-colors ${
                isTransparent ? 'hover:bg-white/10' : 'hover:bg-gray-100'
              }`}
              aria-label="Toggle menu"
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                {[
                  mobileOpen ? 'rotate-45 translate-y-[7px]' : '',
                  mobileOpen ? 'opacity-0 scale-x-0' : '',
                  mobileOpen ? '-rotate-45 -translate-y-[9px]' : '',
                ].map((cls, i) => (
                  <span key={i} className={`block h-0.5 transition-all duration-300 origin-center ${cls} ${
                    isTransparent ? 'bg-white' : 'bg-gray-700'
                  }`} />
                ))}
              </div>
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden bg-white border-t border-gray-100"
            >
              <div className="px-4 py-4 space-y-1">
                {[['/', 'Home'], ['/products', 'Menu'], ['/login', 'Login']].map(([href, label]) => (
                  <Link key={href} href={href} className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">{label}</Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
