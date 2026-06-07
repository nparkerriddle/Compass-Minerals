// Builds a SINGLE self-contained .html (JS + CSS + images all inlined) that can
// be emailed/opened with no server — for sharing a clickable preview.
// Run: npm run build:preview  →  preview/index.html
// Shows seed data; edits don't persist (the /api backend isn't reachable offline).
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  build: {
    outDir: 'preview',
    target: 'es2020',
    assetsInlineLimit: 100_000_000, // inline all images as base64
    cssCodeSplit: false,
    chunkSizeWarningLimit: 20_000,
  },
})
