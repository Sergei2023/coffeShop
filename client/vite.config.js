import { defineConfig } from 'vite'

export default defineConfig({
  base: '/coffeShop/',
  root: '.',
  server: {
    proxy: {
      // Проксируем все запросы /api на Express сервер
      '/coffeShop/api': {
        target: 'http://localhost:3000',  // Твой Express сервер
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/coffeShop/, '')
      }
    }
  }
})