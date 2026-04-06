// src/app/layout.tsx
import type { Metadata } from 'next';
import { Poppins, Noto_Sans_Bengali } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import { Toaster } from 'react-hot-toast';
import Providers from './providers';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-bengali',
  display: 'swap',
});

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
    <html
      lang="en"
      className={`${poppins.variable} ${notoSansBengali.variable}`}
    >
      <body className="font-poppins bg-white text-gray-800 antialiased">
        <Providers>
          <Header />
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
