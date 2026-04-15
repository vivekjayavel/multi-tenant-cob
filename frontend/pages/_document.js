import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Google Fonts - crossOrigin required to prevent CORB */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com"    crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@600;700&display=swap"
          rel="stylesheet"
          crossOrigin="anonymous"
        />
        {/* Razorpay - crossOrigin="anonymous" prevents CORB on script response */}
        <script
          src="https://checkout.razorpay.com/v1/checkout.js"
          async
          defer
          crossOrigin="anonymous"
        />
      </Head>
      <body className="bg-white text-gray-900 antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
