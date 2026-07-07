import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        // Split heavy vendors into their own chunks for better browser caching.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined
          if (
            id.includes('recharts') ||
            id.includes('d3-') ||
            id.includes('victory-vendor')
          ) {
            return 'charts'
          }
          return 'vendor'
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/features/**', 'src/components/**'],
    },
  },
})
