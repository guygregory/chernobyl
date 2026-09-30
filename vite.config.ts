import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: process.env.APP_BASE_PATH ?? './',
  plugins: [react()],
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks: {
          'three-core': ['three'],
          'react-core': ['react', 'react-dom', '@react-three/fiber'],
        },
      },
    },
  },
})
