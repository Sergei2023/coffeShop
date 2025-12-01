import { defineConfig } from 'vite'

export default defineConfig({
  base: '/coffeShop/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: '/src/index.html'
    }
  }
})