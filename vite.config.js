import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  
  build: {
    outDir: 'dist'
  },

  server: {
    port: 3000,
    open: true  // Auto-open browser when running npm run dev
  }
});

