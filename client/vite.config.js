import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    // Google Identity Services authorizes an exact scheme/host/port origin.
    // Do not let Vite silently move to 5174+ when 5173 is occupied.
    port: 5173,
    strictPort: true,
    headers: {
      // Required by Google Identity Services when testing over HTTP on localhost.
      'Referrer-Policy': 'no-referrer-when-downgrade',
    },
    watch: {
      usePolling: true,
      interval: 1000,
    },
    host: true,
    proxy: {
      '/api': {
        target: 'http://server:5000',
        changeOrigin: true,
      },
    },
  },
})
