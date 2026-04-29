import { Html, Head, Main, NextScript } from 'next/document';
import Document from 'next/document';

function darken(hex, pct) {
  if (!hex) return '#B45309';
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (n >> 16) - Math.round(2.55 * pct));
  const g = Math.max(0, ((n >> 8) & 0xff) - Math.round(2.55 * pct));
  const b = Math.max(0, (n & 0xff) - Math.round(2.55 * pct));
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

export default function MyDocument({ themeColor }) {
  const primary = themeColor || '#D97706';
  const dark    = darken(primary, 15);
  const css     = `:root{--tenant-primary:${primary};--tenant-primary-dark:${dark};}`;

  return (
    <Html lang="en">
      <Head>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma"        content="no-cache" />
        <meta httpEquiv="Expires"       content="0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com"    crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@600;700&display=swap"
          rel="stylesheet"
          crossOrigin="anonymous"
        />
      </Head>
      <body className="bg-white text-gray-900 antialiased" suppressHydrationWarning>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

MyDocument.getInitialProps = async (ctx) => {
  const initialProps = await Document.getInitialProps(ctx);
  const themeColor = ctx?.renderPage && ctx?.__NEXT_DATA__?.props?.pageProps?.tenant?.theme_color || null;
  return { ...initialProps, themeColor };
};
