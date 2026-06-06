import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  // Dev only: forward /api to the Flask backend if it's running locally.
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
  build: {
    // Flask serves the built app from static/ (committed so a git clone deploys).
    outDir: 'static',
    emptyOutDir: true,
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'vendor-react'
          if (id.includes('recharts')) return 'vendor-charts'
          if (id.includes('@tanstack/react-table')) return 'vendor-table'
        },
      },
    },
  },
})
