import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,
  },
  base: '/Movegame/', // GitHub Pages 子路径部署
});