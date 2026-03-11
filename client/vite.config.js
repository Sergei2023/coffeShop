import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/coffeShop/',
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        menu: resolve(__dirname, 'menu.html'),
        cart: resolve(__dirname, 'cart.html'),
        login: resolve(__dirname, 'login.html'),
        about: resolve(__dirname, 'about.html'),
        contact: resolve(__dirname, 'contact.html')
      }
    },
    outDir: 'dist'
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});