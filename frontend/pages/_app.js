import { TenantContext } from '../context/TenantContext';
import { CartProvider } from '../context/CartContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  const { tenant } = pageProps;

  // Set CSS variables as inline style on a wrapper div.
  // This is the correct SSR-safe approach — no useEffect, no <style> tags,
  // no hydration mismatch. React handles inline styles identically on
  // server and client.
  const primaryColor     = tenant?.theme_color || '#D97706';
  const primaryDarkColor = _darken(primaryColor, 15);

  const cssVars = {
    '--tenant-primary':      primaryColor,
    '--tenant-primary-dark': primaryDarkColor,
    minHeight:               '100vh',
    display:                 'flex',
    flexDirection:           'column',
  };

  return (
    <TenantContext.Provider value={tenant || {}}>
      <CartProvider>
        {/* CSS variables set as inline style — works on both server and client
            without any hydration mismatch */}
        <div style={cssVars}>
          <Component {...pageProps} />
        </div>
      </CartProvider>
    </TenantContext.Provider>
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
