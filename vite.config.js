import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://callofguns.github.io/business.io/ on GitHub Pages.
  base: '/business.io/',
  plugins: [react(), tailwindcss()],
})
