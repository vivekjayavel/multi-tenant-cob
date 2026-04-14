import Head from 'next/head';
export default function MetaTags({ seo, tenant }) {
  if (!seo) return null;
  const { title, description, canonical, ogTitle, ogDesc, ogImage, ogType = 'website', noindex = false, jsonLd } = seo;
  const robots = noindex ? 'noindex,nofollow' : 'index,follow';
  const jsonLdBlocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  return (
    <Head>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <meta name="robots" content={robots} />
      {canonical && !noindex && <link rel="canonical" href={canonical} />}
      {!noindex && (
        <>
          <meta property="og:type"      content={ogType} />
          <meta property="og:site_name" content={tenant?.name || ''} />
          <meta property="og:locale"    content="en_IN" />
          {canonical && <meta property="og:url" content={canonical} />}
          {(ogTitle || title) && <meta property="og:title" content={ogTitle || title} />}
          {(ogDesc || description) && <meta property="og:description" content={ogDesc || description} />}
          {ogImage && <><meta property="og:image" content={ogImage} /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /></>}
          <meta name="twitter:card" content={ogImage ? 'summary_large_image' : 'summary'} />
          {(ogTitle || title) && <meta name="twitter:title" content={ogTitle || title} />}
          {ogImage && <meta name="twitter:image" content={ogImage} />}
        </>
      )}
      {jsonLdBlocks.map((block, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }} />
      ))}
    </Head>
  );
}
