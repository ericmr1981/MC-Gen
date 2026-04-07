import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
const backendTarget = process.env.VITE_NEXUS_BACKEND || 'http://localhost:7878'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Serve from /nexus/ sub-route (Home Portal unified entry)
  base: '/nexus/',
  server: {
    port: 5173,
    strictPort: true,
    // Dev-only: proxy /nexus/* paths to the Nexus backend.
    // Works when served from Home Portal at /nexus/ or directly from :5173
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true
      },
      '/nexus/ws': {
        target: backendTarget,
        ws: true,
        changeOrigin: true
      },
      '/nexus/api': {
        target: backendTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nexus\/api/, '/api')
      }
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
})
