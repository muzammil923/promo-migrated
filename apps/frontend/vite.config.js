import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@games': path.resolve(__dirname, '../../games'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Route-level code splitting already keeps page chunks small;
    // raise the warning threshold since some vendor chunks are legitimately big.
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // Split heavy vendor libraries into their own chunks so they can be
        // cached independently and only loaded when actually needed.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          const path = id.replace(/\\/g, '/')
          if (path.includes('/react/') || path.includes('/react-dom/') || path.includes('/react-router')) return 'react-vendor'
          if (path.includes('/three/') || path.includes('@react-three')) return 'three'
          if (path.includes('/gsap/')) return 'gsap'
          if (path.includes('/leaflet/') || path.includes('/react-leaflet/')) return 'leaflet'
          if (path.includes('/recharts/')) return 'recharts'
          if (path.includes('/framer-motion/')) return 'framer-motion'
        }
      }
    }
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    // Allow access via Cloudflare tunnels (`cloudflared tunnel --url ...`).
    // The random *.trycloudflare.com subdomain changes on every tunnel
    // restart, so allow the whole suffix instead of a fixed hostname.
    allowedHosts: ['.trycloudflare.com'],
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      // Chess online mode — WebSocket upgrade (rematch push). `ws: true` is
      // required for Vite to proxy the HTTP upgrade handshake.
      '/ws/chess': {
        target: 'http://localhost:8080',
        ws: true,
        changeOrigin: true
      }
    }
  }
})
