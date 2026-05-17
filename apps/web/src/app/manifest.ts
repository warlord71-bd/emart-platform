import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Emart Skincare Bangladesh',
    short_name: 'Emart',
    description: 'Authentic K-Beauty & global skincare in Bangladesh. COSRX, CeraVe, The Ordinary & more.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#c76882',
    icons: [
      { src: '/icon-48.png',       sizes: '48x48',   type: 'image/png', purpose: 'any' },
      { src: '/icon-72.png',       sizes: '72x72',   type: 'image/png', purpose: 'any' },
      { src: '/icon-96.png',       sizes: '96x96',   type: 'image/png', purpose: 'any' },
      { src: '/icon-144.png',      sizes: '144x144', type: 'image/png', purpose: 'any' },
      { src: '/icon-192.png',      sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png',      sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    categories: ['shopping', 'beauty'],
  };
}
