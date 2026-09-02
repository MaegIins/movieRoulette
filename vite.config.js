import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    proxy: {
      // en dev, le front (ce serveur Vite) et l'API (server/index.js) tournent en parallèle
      '/api': 'http://localhost:3001',
    },
  },
})
