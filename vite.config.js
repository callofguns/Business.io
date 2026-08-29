import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://callofguns.github.io/Business.io/ on GitHub Pages.
  // Repo is "Business.io" (capital B) -- GH Pages project-site paths are
  // case-sensitive, so this must match the repo name exactly.
  base: '/Business.io/',
  plugins: [react(), tailwindcss()],
})
