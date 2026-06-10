import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,
  },
  base: '/movegame/', // GitHub Pages 子路径部署
});