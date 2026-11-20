import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

// Publicado em https://iuryfranca.github.io/idlehub/ (GitHub Pages), por isso o base.
export default defineConfig({
  base: '/idlehub/',
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        privacidade: resolve(import.meta.dirname, 'privacidade.html')
      }
    }
  }
});
