import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  server: {
    open: true,
    fs: {
      allow: [
        // Allow serving files from the project root and engine package
        path.resolve(__dirname, '..', 'engine'),
        path.resolve(__dirname, '..', 'game'),
      ],
    },
  },
  resolve: {
    alias: {
      'nanojet': path.resolve(__dirname, '../engine/src'),
    },
  },
});
