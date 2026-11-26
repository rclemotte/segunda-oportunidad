import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Segunda Oportunidad',
    short_name: 'Segunda Op.',
    description: 'Moda y accesorios de segunda mano en Paraguay. Todo merece otra oportunidad.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8F6FB',
    theme_color: '#3A0D66',
    lang: 'es-PY',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
