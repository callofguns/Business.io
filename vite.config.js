import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

const base = '/Business.io/'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://callofguns.github.io/Business.io/ on GitHub Pages.
  // Repo is "Business.io" (capital B) -- GH Pages project-site paths are
  // case-sensitive, so this must match the repo name exactly.
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'business.io',
        short_name: 'business.io',
        description: 'A browser-based business tycoon simulator — build your empire.',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#f6f7f9',
        theme_color: '#3b82f6',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
