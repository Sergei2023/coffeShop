import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  root: '.',
  server: {
    proxy: {
      '/api': { 
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})