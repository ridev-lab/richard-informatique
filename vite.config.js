import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const r = (p) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        main: r('./index.html'),
        legal: r('./mentions-legales/index.html'),
        notfound: r('./404.html'),
      },
      output: {
        manualChunks: { three: ['three'], gsap: ['gsap', 'gsap/ScrollTrigger', 'gsap/SplitText', 'lenis'] },
      },
    },
  },
});
