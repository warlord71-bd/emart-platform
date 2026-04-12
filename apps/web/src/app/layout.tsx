// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import UtilityBar from '@/components/layout/UtilityBar';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import { Toaster } from 'react-hot-toast';
import Providers from './providers';

export const metadata: Metadata = {
  metadataBase: new URL('https://e-mart.com.bd'),
  title: {
    default: 'Emart Skincare Bangladesh — Korean & Japanese Beauty',
    template: '%s | Emart Skincare Bangladesh',
  },
  description:
    "Bangladesh's #1 destination for authentic Korean & Japanese skincare. 100% genuine products, fast delivery, COD available.",
  keywords: [
    'Korean skincare Bangladesh',
    'Japanese skincare Bangladesh',
    'K-beauty Bangladesh',
    'authentic skincare Dhaka',
    'COSRX Bangladesh',
    'skin care price Bangladesh',
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
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              'name': 'Emart Skincare Bangladesh',
              'url': 'https://e-mart.com.bd',
              'logo': 'https://5.189.188.229/wp-content/uploads/2026/03/logo.png',
              'description': "Bangladesh's #1 destination for authentic Korean & Japanese skincare",
              'sameAs': [
                'https://www.facebook.com/emartbd.official',
                'https://www.instagram.com/emartbd',
              ],
              'contactPoint': {
                '@type': 'ContactPoint',
                'telephone': '+880-9697-597399',
                'contactType': 'Customer Service',
                'areaServed': 'BD',
                'availableLanguage': ['en', 'bn'],
              },
              'address': {
                '@type': 'PostalAddress',
                'streetAddress': '17, Central Road (Near Ideal College)',
                'addressLocality': 'Dhanmondi',
                'addressRegion': 'Dhaka',
                'postalCode': '1205',
                'addressCountry': 'BD',
              },
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
              'name': 'Emart Skincare Bangladesh',
              'potentialAction': {
                '@type': 'SearchAction',
                'target': 'https://e-mart.com.bd/search?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body className="font-sans bg-white text-gray-800 antialiased">
        <Providers>
          <UtilityBar />
          <Header />
          <Navigation />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <CartDrawer />
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                fontFamily: 'Poppins, sans-serif',
                borderRadius: '10px',
              },
              success: {
                iconTheme: { primary: '#e8197a', secondary: '#fff' },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
