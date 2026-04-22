import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { m as motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import CartDrawer from '../ui/CartDrawer';
import { useTenant, useSettings } from '../../context/TenantContext';

const NAV_LINKS = [
  { href: '/',         label: 'Home'    },
  { href: '/products', label: 'Menu'    },
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

  const heroHasImage = !!(settings?.hero?.image_url);
  const isHomePage   = router.pathname === '/';
  const isTransparent = isHomePage && !scrolled && heroHasImage;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled ? 'shadow-md' : ''
        } ${isTransparent ? 'bg-transparent' : 'bg-white'}`}
      >
        {/* ── Row 1: icons | logo | icons ── */}
        <div className={`border-b transition-colors ${isTransparent ? 'border-white/20' : 'border-gray-100'}`}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 sm:h-20">

            {/* Left icons: search + account */}
            <div className="flex items-center gap-3 w-24">
              <button
                className={`p-2 rounded-full transition-colors ${isTransparent ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'}`}
                aria-label="Search"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
                </svg>
              </button>
              <Link href="/login"
                className={`p-2 rounded-full transition-colors ${isTransparent ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'}`}
                aria-label="Account"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/>
                </svg>
              </Link>
            </div>

            {/* Centre: Logo */}
            <Link href="/" className="flex flex-col items-center gap-0.5 group">
              {tenant?.logo_url ? (
                <motion.img
                  src={tenant.logo_url}
                  alt={tenant.name || 'Bakery'}
                  className={`h-12 sm:h-14 w-auto object-contain transition-all duration-300 ${isTransparent ? '' : ''}`}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              ) : (
                <motion.span
                  className="font-display text-xl sm:text-2xl font-bold"
                  style={{ color: isTransparent ? '#fff' : 'var(--tenant-primary)' }}
                  whileHover={{ scale: 1.03 }}
                >
                  {tenant?.name || 'Bakery'}
                </motion.span>
              )}
              {/* Show name below logo when logo is present */}
              {tenant?.logo_url && tenant?.name && (
                <span
                  className="text-[10px] font-semibold tracking-widest uppercase hidden sm:block"
                  style={{ color: isTransparent ? 'rgba(255,255,255,0.7)' : 'var(--tenant-primary)' }}
                >
                  {tenant.name}
                </span>
              )}
            </Link>

            {/* Right icons: wishlist + cart + hamburger */}
            <div className="flex items-center gap-2 w-24 justify-end">
              {/* Cart */}
              <button
                onClick={() => setCartOpen(true)}
                className={`relative p-2 rounded-full transition-colors ${isTransparent ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'}`}
                aria-label="Open cart"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m12-9l2 9M9 21a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z"/>
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

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className={`md:hidden p-2 rounded-full transition-colors ${isTransparent ? 'text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'}`}
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
        <div className={`hidden md:block transition-colors ${isTransparent ? 'bg-transparent' : 'bg-white border-b border-gray-100'}`}>
          <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-center gap-8 h-11">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`relative text-sm font-semibold tracking-wide transition-colors pb-0.5 ${
                  router.pathname === href ? '' : isTransparent ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
                style={router.pathname === href ? { color: isTransparent ? '#fff' : 'var(--tenant-primary)' } : {}}
              >
                {label}
                {router.pathname === href && (
                  <motion.div
                    layoutId="navUnderline"
                    className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full"
                    style={{ backgroundColor: isTransparent ? '#fff' : 'var(--tenant-primary)' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* ── Zigzag border ── */}
        {!isTransparent && (
          <div className="h-2 w-full overflow-hidden">
            <svg viewBox="0 0 1200 8" preserveAspectRatio="none" className="w-full h-full" style={{ display: 'block' }}>
              <path
                d="M0 0 L20 8 L40 0 L60 8 L80 0 L100 8 L120 0 L140 8 L160 0 L180 8 L200 0 L220 8 L240 0 L260 8 L280 0 L300 8 L320 0 L340 8 L360 0 L380 8 L400 0 L420 8 L440 0 L460 8 L480 0 L500 8 L520 0 L540 8 L560 0 L580 8 L600 0 L620 8 L640 0 L660 8 L680 0 L700 8 L720 0 L740 8 L760 0 L780 8 L800 0 L820 8 L840 0 L860 8 L880 0 L900 8 L920 0 L940 8 L960 0 L980 8 L1000 0 L1020 8 L1040 0 L1060 8 L1080 0 L1100 8 L1120 0 L1140 8 L1160 0 L1180 8 L1200 0 L1200 8 L0 8 Z"
                fill="var(--tenant-primary)"
                opacity="0.15"
              />
            </svg>
          </div>
        )}

        {/* ── Mobile menu ── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden bg-white border-t border-gray-100"
            >
              <nav className="px-4 py-4 flex flex-col gap-1">
                {[...NAV_LINKS, { href: '/login', label: 'Account' }].map(({ href, label }) => (
                  <Link key={href} href={href}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
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
