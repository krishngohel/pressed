import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.tex'],
  server: {
    port: 5173,
    proxy: {
      // During local dev, run `netlify dev` (port 8888) for functions
      '/api': {
        target: 'http://localhost:8888/.netlify/functions/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
