// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import { Toaster } from 'react-hot-toast';
import Providers from './providers';
import Script from 'next/script';
import { DM_Sans, JetBrains_Mono, Playfair_Display } from 'next/font/google';
import { COMPANY } from '@/lib/companyProfile';

const GOOGLE_TAG_ID = process.env.NEXT_PUBLIC_GOOGLE_TAG_ID || 'G-WMJNX87Q2N';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display-loaded',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body-loaded',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono-loaded',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://e-mart.com.bd'),
  title: {
    default: 'Emart Skincare Bangladesh',
    template: '%s | Emart',
  },
  description:
    "Authentic global beauty for Bangladesh. Shop original skincare, haircare, and beauty products from Emart with trusted support, careful verification, and nationwide delivery.",
  keywords: [
    'K-Beauty Bangladesh',
    'Korean skincare Bangladesh',
    'COSRX Bangladesh',
    'authentic skincare Bangladesh',
    'CeraVe Bangladesh',
    'The Ordinary Bangladesh',
    'global beauty brands Bangladesh',
    'original imported skincare bd',
    'skin care price Bangladesh',
    'kbeauty dhaka',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_BD',
    url: 'https://e-mart.com.bd',
    siteName: 'Emart Skincare Bangladesh',
    images: [
      {
        url: 'https://e-mart.com.bd/wp-content/uploads/2026/03/logo.png',
        width: 600,
        height: 600,
        alt: 'Emart Skincare Bangladesh',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@emartbd',
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable} ${jetbrains.variable}`}>
      <head>
        {GOOGLE_TAG_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-tag" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GOOGLE_TAG_ID}');
              `}
            </Script>
          </>
        )}
        {/* LocalBusiness + Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': ['LocalBusiness', 'Organization'],
                  '@id': 'https://e-mart.com.bd/#organization',
                  'name': 'E-mart Bangladesh',
                  'alternateName': COMPANY.storeName,
                  'url': 'https://e-mart.com.bd',
                  'logo': {
                    '@type': 'ImageObject',
                    'url': 'https://e-mart.com.bd/wp-content/uploads/2026/03/logo.png',
                    'width': 600,
                    'height': 600,
                  },
                  'image': 'https://e-mart.com.bd/wp-content/uploads/2026/03/logo.png',
                  'description': `${COMPANY.storeName} is an enterprise of ${COMPANY.enterpriseName}, serving Bangladesh with authentic global beauty products, careful product verification, and local customer support from Dhanmondi.`,
                  'address': {
                    '@type': 'PostalAddress',
                    'streetAddress': `${COMPANY.office.line1} ${COMPANY.office.line2}`,
                    'addressLocality': 'Dhanmondi',
                    'addressRegion': 'Dhaka',
                    'postalCode': '1205',
                    'addressCountry': 'BD',
                  },
                  'telephone': COMPANY.phones.hotlineHref,
                  'email': COMPANY.supportEmail,
                  'openingHours': 'Sa-Th 09:00-21:00',
                  'priceRange': '৳৳',
                  'currenciesAccepted': 'BDT',
                  'paymentAccepted': 'Cash, bKash, Nagad',
                  'areaServed': { '@type': 'Country', 'name': 'Bangladesh' },
                  'sameAs': [
                    COMPANY.social.facebook,
                    COMPANY.social.instagram,
                    COMPANY.social.youtube,
                    COMPANY.social.x,
                    'https://www.google.com/maps/search/?api=1&query=E-mart+Bangladesh+Dhanmondi+Dhaka',
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

        {/* Website Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              'url': 'https://e-mart.com.bd',
              'name': COMPANY.storeName,
              'potentialAction': {
                '@type': 'SearchAction',
                'target': 'https://e-mart.com.bd/search?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body className="max-w-full overflow-x-hidden bg-bg font-body text-ink-2 antialiased">
        <Providers>
          <Header />
          <main className="min-h-screen max-w-full overflow-x-hidden">{children}</main>
          <Footer />
          <CartDrawer />
          {/* WhatsApp Float Button */}
          <a
            href={COMPANY.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp"
            className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-transform hover:scale-110 lg:bottom-8"
          >
            <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                fontFamily: 'DM Sans, Hind Siliguri, sans-serif',
                borderRadius: '10px',
              },
              success: {
                iconTheme: { primary: '#c76882', secondary: '#fff' },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
