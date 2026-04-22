import { useEffect } from 'react';
import { LazyMotion, domAnimation } from 'framer-motion';
import { ToastProvider } from '../components/ui/Toast';
import { TenantContext, SettingsContext } from '../context/TenantContext';
import { CartProvider } from '../context/CartContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  const { tenant } = pageProps;

  useEffect(() => {
    if (!tenant?.theme_color) return;
    const root = document.documentElement;
    root.style.setProperty('--tenant-primary',      tenant.theme_color);
    root.style.setProperty('--tenant-primary-dark', _darken(tenant.theme_color, 15));
  }, [tenant?.theme_color]);

  return (
    // LazyMotion loads animation features only on client, preventing SSR mismatch
    <LazyMotion features={domAnimation}>
      <ToastProvider>
      <TenantContext.Provider value={tenant || {}}>
        <CartProvider>
          <Component {...pageProps} />
        </CartProvider>
      </TenantContext.Provider>
      </ToastProvider>
    </LazyMotion>
  );
}

function _darken(hex, amount) {
  try {
    const num = parseInt((hex || '#D97706').replace('#', ''), 16);
    const r   = Math.max(0, (num >> 16) - amount);
    const g   = Math.max(0, ((num >> 8) & 0xFF) - amount);
    const b   = Math.max(0, (num & 0xFF) - amount);
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  } catch { return '#B45309'; }
}
