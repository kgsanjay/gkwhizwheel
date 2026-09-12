import React from 'react';
import { Head } from '@inertiajs/react';

/**
 * Reusable SEO Head component for Inertia React.
 *
 * @param {Object} props
 * @param {string} props.title - Page title string.
 * @param {string} [props.description] - Meta description text.
 * @param {string} [props.canonicalUrl] - Absolute canonical URL for the page.
 * @param {string} [props.ogImage] - Open Graph image URL or absolute path.
 * @param {string} [props.ogType='website'] - Open Graph type (website, article, product, etc.).
 * @param {Object|Array} [props.structuredData] - JSON-LD schema object or array of schemas.
 * @param {string} [props.keywords] - Optional comma-separated meta keywords.
 * @param {React.ReactNode} [props.children] - Additional child head tags.
 */
export default function PageHead({
    title,
    description,
    canonicalUrl,
    ogImage = '/images/logo.png',
    ogType = 'website',
    structuredData = null,
    keywords,
    children,
}) {
    const siteName = 'GK WhizWheel';
    const imageToUse = ogImage || '/images/logo.png';

    return (
        <Head>
            {/* Title Tag */}
            {title && <title>{title}</title>}

            {/* Meta Description & Keywords */}
            {description && <meta name="description" content={description} head-key="description" />}
            {keywords && <meta name="keywords" content={keywords} head-key="keywords" />}

            {/* Canonical Link */}
            {canonicalUrl && <link rel="canonical" href={canonicalUrl} head-key="canonical" />}

            {/* Open Graph Tags */}
            {title && <meta property="og:title" content={title} head-key="og:title" />}
            {description && <meta property="og:description" content={description} head-key="og:description" />}
            <meta property="og:type" content={ogType || 'website'} head-key="og:type" />
            <meta property="og:site_name" content={siteName} head-key="og:site_name" />
            {canonicalUrl && <meta property="og:url" content={canonicalUrl} head-key="og:url" />}
            {imageToUse && <meta property="og:image" content={imageToUse} head-key="og:image" />}

            {/* Twitter Card Tags */}
            <meta name="twitter:card" content="summary_large_image" head-key="twitter:card" />
            {title && <meta name="twitter:title" content={title} head-key="twitter:title" />}
            {description && <meta name="twitter:description" content={description} head-key="twitter:description" />}
            {imageToUse && <meta name="twitter:image" content={imageToUse} head-key="twitter:image" />}

            {/* Structured Data (JSON-LD) */}
            {structuredData && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
                    }}
                />
            )}

            {children}
        </Head>
    );
}
