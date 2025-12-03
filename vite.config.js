import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  root: '.',
  
  build: {
    outDir: 'dist'
  },

  plugins: [
    viteStaticCopy({
      targets: [
        { src: 'script.js', dest: '.' },
        { src: 'style.css', dest: '.' },
        { src: 'sounds', dest: '.' },
        { src: 'images.js', dest: '.' },
        { src: 'topics', dest: '.' },
        { src: 'quiz-card', dest: '.' },
        { src: 'capitals.json', dest: '.' },
        { src: 'languages', dest: '.' }
      ]
    })
  ],

  server: {
    port: 3000,
    open: true
  }
});

