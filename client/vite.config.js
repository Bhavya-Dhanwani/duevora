import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:3000'

export default defineConfig({
  plugins: [react()],
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
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
})
