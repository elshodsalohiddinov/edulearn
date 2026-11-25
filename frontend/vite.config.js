// Vite sozlamalari. Ishlab chiqishda /api so'rovlari backendga (3000-port) yo'naltiriladi —
// shunda frontend va backend bitta "origin" da ishlaydi va HttpOnly cookie muammosiz yuradi.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true, // lokal tarmoqdagi telefonlardan ham ochish mumkin
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: false },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    globals: true,
  },
});
