import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2015',
    // Warn when a chunk exceeds 500 kB
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — cached separately between deploys
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Data-fetching + state
          'vendor-query': ['@tanstack/react-query'],
          // UI component library helpers
          'vendor-ui': ['class-variance-authority', 'clsx', 'tailwind-merge', 'lucide-react'],
          // Form / validation
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // HTTP
          'vendor-axios': ['axios'],
        },
      },
    },
  },
})
