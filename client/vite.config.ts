import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
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
        target: 'http://localhost:7878',
        changeOrigin: true
      },
      '/nexus/ws': {
        target: 'http://localhost:7878',
        ws: true,
        changeOrigin: true
      },
      '/nexus/api': {
        target: 'http://localhost:7878',
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
