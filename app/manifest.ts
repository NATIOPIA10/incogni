import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Incogni',
    short_name: 'Incogni',
    description: 'A privacy-first university dating experience.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B0E14',
    theme_color: '#0B0E14',
    icons: [
      {
        src: '/icon.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
