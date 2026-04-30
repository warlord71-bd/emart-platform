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
      { src: '/logo.png',          sizes: '192x192', type: 'image/png' },
      { src: '/logo.png',          sizes: '512x512', type: 'image/png' },
    ],
    categories: ['shopping', 'beauty'],
  };
}
