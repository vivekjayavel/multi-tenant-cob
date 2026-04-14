import { useEffect } from 'react';
import { TenantContext } from '../context/TenantContext';
import { CartProvider } from '../context/CartContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  const { tenant } = pageProps;

  // Set CSS variables for tenant theming
  // This runs both on server (via inline style) and client (via useEffect)
  const primaryColor     = tenant?.theme_color || '#D97706';
  const primaryDarkColor = _darken(primaryColor, 15);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--tenant-primary',      primaryColor);
    root.style.setProperty('--tenant-primary-dark', primaryDarkColor);
  }, [primaryColor, primaryDarkColor]);

  return (
    <>
      {/* Set CSS vars server-side to prevent flash / hydration mismatch */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --tenant-primary: ${primaryColor};
          --tenant-primary-dark: ${primaryDarkColor};
        }
      ` }} />
      <TenantContext.Provider value={tenant || {}}>
        <CartProvider>
          <Component {...pageProps} />
        </CartProvider>
      </TenantContext.Provider>
    </>
  );
}

function _darken(hex, amount) {
  try {
    const num = parseInt((hex || '#D97706').replace('#', ''), 16);
    const r   = Math.max(0, (num >> 16) - amount);
    const g   = Math.max(0, ((num >> 8) & 0xFF) - amount);
    const b   = Math.max(0, (num & 0xFF) - amount);
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  } catch {
    return '#B45309';
  }
}
