import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { m as motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import CartDrawer from '../ui/CartDrawer';
import { useTenant, useSettings } from '../../context/TenantContext';

const NAV_LINKS = [
  { href: '/',         label: 'Home' },
  { href: '/products', label: 'Menu' },
];

export default function Navbar({ tenant: tenantProp }) {
  const tenant   = useTenant() || tenantProp || {};
  const settings = useSettings();
  const [scrolled,   setScrolled]   = useState(false);
  const [cartOpen,   setCartOpen]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount, hydrated } = useCart();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 5);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { setMobileOpen(false); }, [router.pathname]);

  const heroHasImage  = !!(settings?.hero?.image_url);
  const isHomePage    = router.pathname === '/';
  const isTransparent = isHomePage && !scrolled && heroHasImage;

  const textCol    = isTransparent ? 'text-white'     : 'text-gray-700';
  const hoverBg    = isTransparent ? 'hover:bg-white/10' : 'hover:bg-gray-100';
  const borderCol  = isTransparent ? 'border-white/20' : 'border-gray-100';

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isTransparent ? 'bg-transparent' : 'bg-white'
        } ${scrolled ? 'shadow-md' : ''}`}
      >
        {/* ── Row 1: Shop name left | Logo centre | Cart right ── */}
        <div className={`border-b ${borderCol}`}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-20 sm:h-24">

            {/* Left: Shop name */}
            <Link href="/" className="flex flex-col group min-w-0 flex-1">
              <motion.span
                className="font-display text-lg sm:text-xl font-bold leading-tight truncate"
                style={{ color: isTransparent ? '#fff' : 'var(--tenant-primary)' }}
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {tenant?.name || 'Bakery'}
              </motion.span>
              <span
                className="text-[10px] font-medium tracking-widest uppercase mt-0.5"
                style={{ color: isTransparent ? 'rgba(255,255,255,0.6)' : 'color-mix(in srgb, var(--tenant-primary) 70%, gray)' }}
              >
                Bakery & Cakes
              </span>
            </Link>

            {/* Centre: Circular logo */}
            {tenant?.logo_url && (
              <Link href="/" className="flex-shrink-0 mx-4">
                <motion.div
                  className="rounded-full overflow-hidden border-4 bg-white shadow-lg"
                  style={{ width: 80, height: 80, borderColor: 'var(--tenant-primary)' }}
                  whileHover={{ scale: 1.06 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <img
                    src={tenant.logo_url}
                    alt={tenant.name || 'Logo'}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.parentElement.style.display = 'none'; }}
                  />
                </motion.div>
              </Link>
            )}

            {/* Right: Cart + hamburger */}
            <div className="flex items-center gap-2 flex-1 justify-end">
              <button
                onClick={() => setCartOpen(true)}
                className={`relative p-2.5 rounded-full transition-colors ${textCol} ${hoverBg}`}
                aria-label="Open cart"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m12-9l2 9M9 21a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z"/>
                </svg>
                {hydrated && itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--tenant-primary)' }}
                  >
                    {itemCount > 9 ? '9+' : itemCount}
                  </motion.span>
                )}
              </button>

              {/* Hamburger (mobile) */}
              <button
                onClick={() => setMobileOpen(o => !o)}
                className={`md:hidden p-2.5 rounded-full transition-colors ${textCol} ${hoverBg}`}
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  {mobileOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
                  }
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── Row 2: Nav links (desktop) ── */}
        <div className={`hidden md:block ${isTransparent ? '' : 'bg-white border-b border-gray-100'}`}>
          <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-center gap-10 h-10">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`relative text-sm font-semibold tracking-wide transition-colors ${
                  router.pathname === href
                    ? ''
                    : isTransparent ? 'text-white/80 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                }`}
                style={router.pathname === href ? { color: isTransparent ? '#fff' : 'var(--tenant-primary)' } : {}}
              >
                {label}
                {router.pathname === href && (
                  <motion.div
                    layoutId="navUnderline"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full"
                    style={{ backgroundColor: isTransparent ? '#fff' : 'var(--tenant-primary)' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* ── Mobile menu ── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden bg-white border-t border-gray-100"
            >
              <nav className="px-4 py-3 flex flex-col gap-1">
                {[...NAV_LINKS, { href: '/login', label: 'Account' }].map(({ href, label }) => (
                  <Link key={href} href={href}
                    className="flex items-center px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    style={router.pathname === href ? { color: 'var(--tenant-primary)', backgroundColor: 'color-mix(in srgb, var(--tenant-primary) 8%, transparent)' } : {}}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
