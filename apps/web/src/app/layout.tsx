// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';
import '@/styles/midnight-blossom.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppFloat from '@/components/layout/WhatsAppFloat';
import Providers from './providers';
import RuntimeWidgets from './runtime-widgets';
import { Suspense } from 'react';
import AttributionTracker from '@/components/AttributionTracker';
import { DM_Sans, Hind_Siliguri, JetBrains_Mono, Jost, Playfair_Display } from 'next/font/google';
import { COMPANY } from '@/lib/companyProfile';
import { SITE_URL, absoluteUrl } from '@/lib/siteUrl';
import { STORE_POLICIES } from '@/config/storePolicies';

const GOOGLE_TAG_ID = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID || 'G-WMJNX87Q2N';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-display-loaded',
  display: 'swap',
  preload: false,
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body-loaded',
  display: 'swap',
  preload: false,
});

const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '600'],
  variable: '--font-bengali-loaded',
  display: 'swap',
  preload: false,
});

const jost = Jost({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-sans-loaded',
  display: 'swap',
  preload: false,
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-mono-loaded',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Emart Skincare Bangladesh | Korean & Global Beauty',
    template: '%s | Emart',
  },
  description:
    'Shop authentic Korean, Japanese and global skincare in Bangladesh from Emart Skincare Bangladesh. Carefully curated beauty products, local support, faster delivery and trusted service.',
  alternates: {
    canonical: SITE_URL,
    types: {
      'application/rss+xml': [
        { url: `${SITE_URL}/feed.xml`, title: 'Emart Skincare Bangladesh — Blog' },
      ],
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_BD',
    url: SITE_URL,
    siteName: 'Emart Skincare Bangladesh',
    images: [
      {
        url: absoluteUrl('/wp-content/uploads/2026/03/logo.png'),
        width: 600,
        height: 600,
        alt: 'Emart Skincare Bangladesh',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@emartskincarebd',
  },
  icons: {
    icon: [
      { url: '/icon-48.png',  sizes: '48x48',   type: 'image/png' },
      { url: '/icon-96.png',  sizes: '96x96',   type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    shortcut: '/icon-192.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  other: {
    'p:domain_verify': '39735e3185a8389cc1a41436b6068ad5',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-BD" className={`${playfair.variable} ${dmSans.variable} ${hindSiliguri.variable} ${jost.variable} ${jetbrains.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Product images and YouTube thumbnails used in homepage */}
        <link rel="preconnect" href="https://e-mart.com.bd" />
        <link rel="dns-prefetch" href="https://img.youtube.com" />
        {/* OnlineStore + Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebSite',
                  '@id': `${SITE_URL}/#website`,
                  'url': SITE_URL,
                  'name': COMPANY.storeName,
                  'description': 'Korean & Global Beauty',
                  'publisher': { '@id': `${SITE_URL}/#organization` },
                  'potentialAction': {
                    '@type': 'SearchAction',
                    'target': {
                      '@type': 'EntryPoint',
                      'urlTemplate': `${SITE_URL}/shop?search={search_term_string}`,
                    },
                    'query-input': 'required name=search_term_string',
                  },
                },
                {
                  '@type': ['OnlineStore', 'Organization', 'LocalBusiness'],
                  '@id': `${SITE_URL}/#organization`,
                  'name': COMPANY.storeName,
                  'alternateName': COMPANY.brandName,
                  'url': SITE_URL,
                  'logo': {
                    '@type': 'ImageObject',
                    'url': absoluteUrl('/wp-content/uploads/2026/03/logo.png'),
                    'width': 600,
                    'height': 600,
                  },
                  'image': absoluteUrl('/wp-content/uploads/2026/03/logo.png'),
                  'description': `${COMPANY.storeName} is an online beauty store from ${COMPANY.enterpriseName}, based in Dhaka and serving customers across Bangladesh with authentic global beauty products, careful product checks, and delivery support nationwide.`,
                  'address': {
                    '@type': 'PostalAddress',
                    'streetAddress': COMPANY.shop.streetAddress,
                    'addressLocality': COMPANY.shop.addressLocality,
                    'addressRegion': COMPANY.shop.addressRegion,
                    'postalCode': COMPANY.shop.postalCode,
                    'addressCountry': COMPANY.shop.addressCountry,
                  },
                  'geo': {
                    '@type': 'GeoCoordinates',
                    'latitude': COMPANY.shop.geo.latitude,
                    'longitude': COMPANY.shop.geo.longitude,
                  },
                  'hasMap': `https://www.google.com/maps?q=${COMPANY.shop.geo.latitude},${COMPANY.shop.geo.longitude}`,
                  'telephone': COMPANY.phones.hotlineHref,
                  'email': COMPANY.supportEmail,
                  'openingHours': 'Sa-Th 09:00-21:00',
                  'priceRange': '৳৳',
                  'currenciesAccepted': 'BDT',
                  'paymentAccepted': 'Cash, bKash, Nagad',
                  'areaServed': { '@type': 'Country', 'name': 'BD' },
                  'serviceArea': {
                    '@type': 'AdministrativeArea',
                    'name': 'Bangladesh',
                    'containsPlace': [
                      { '@type': 'City', 'name': 'Dhaka' },
                      { '@type': 'City', 'name': 'Chattogram' },
                      { '@type': 'City', 'name': 'Sylhet' },
                      { '@type': 'City', 'name': 'Rajshahi' },
                      { '@type': 'City', 'name': 'Khulna' },
                      { '@type': 'City', 'name': 'Barishal' },
                      { '@type': 'City', 'name': 'Mymensingh' },
                      { '@type': 'City', 'name': 'Rangpur' },
                    ],
                  },
                  'availableDeliveryMethod': 'https://schema.org/ParcelService',
                  'hasShippingService': {
                    '@type': 'ShippingService',
                    '@id': `${SITE_URL}/#bangladesh-shipping`,
                    'name': 'Bangladesh nationwide delivery',
                    'description': 'Delivery is available across Bangladesh, with shipping cost confirmed at checkout.',
                    'fulfillmentType': 'https://schema.org/FulfillmentTypeDelivery',
                    'handlingTime': {
                      '@type': 'ServicePeriod',
                      'duration': {
                        '@type': 'QuantitativeValue',
                        'minValue': 0,
                        'maxValue': 1,
                        'unitCode': 'DAY',
                      },
                    },
                    'shippingConditions': {
                      '@type': 'ShippingConditions',
                      'shippingDestination': {
                        '@type': 'DefinedRegion',
                        'addressCountry': 'BD',
                        'name': 'Bangladesh',
                      },
                      'shippingRate': {
                        '@type': 'MonetaryAmount',
                        'currency': 'BDT',
                        'value': STORE_POLICIES.shipping.merchantCenterFlatShippingFee,
                      },
                      'transitTime': {
                        '@type': 'ServicePeriod',
                        'duration': {
                          '@type': 'QuantitativeValue',
                          'minValue': 1,
                          'maxValue': 6,
                          'unitCode': 'DAY',
                        },
                      },
                    },
                  },
                  'sameAs': [
                    COMPANY.social.facebook,
                    COMPANY.social.instagram,
                    COMPANY.social.youtube,
                    COMPANY.social.x,
                    COMPANY.social.tiktok,
                    `https://www.google.com/maps?q=${COMPANY.shop.geo.latitude},${COMPANY.shop.geo.longitude}`,
                  ],
                  'founder': {
                    '@type': 'Person',
                    'name': COMPANY.founderName,
                    'url': COMPANY.founderUrl,
                  },
                  'numberOfEmployees': {
                    '@type': 'QuantitativeValue',
                    'value': COMPANY.teamSize,
                  },
                  'parentOrganization': {
                    '@type': 'Organization',
                    'name': COMPANY.enterpriseName,
                  },
                  'contactPoint': [
                    {
                      '@type': 'ContactPoint',
                      'telephone': COMPANY.phones.hotlineHref,
                      'contactType': 'customer service',
                      'email': COMPANY.supportEmail,
                      'areaServed': 'BD',
                      'availableLanguage': ['en', 'bn'],
                    },
                    {
                      '@type': 'ContactPoint',
                      'telephone': COMPANY.phones.salesHref,
                      'contactType': 'sales',
                      'areaServed': 'BD',
                      'availableLanguage': ['en', 'bn'],
                    },
                  ],
                },
              ],
            }),
          }}
        />

      </head>
      <body className="max-w-full overflow-x-hidden bg-bg font-body text-ink-2 antialiased">
        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink focus:shadow-lg focus:outline-none"
          >
            Skip to content
          </a>
          <Header />
          <main id="main-content" className="min-h-screen max-w-full overflow-x-hidden pb-20 lg:pb-0">{children}</main>
          <Footer />
          <WhatsAppFloat />
          <RuntimeWidgets googleTagId={GOOGLE_TAG_ID} />
          <Suspense fallback={null}><AttributionTracker /></Suspense>
        </Providers>
      </body>
    </html>
  );
}
