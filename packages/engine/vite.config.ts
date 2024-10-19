import { defineConfig } from 'vite';
import path from 'path';
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'NanoJet',
      formats: ['es'],
      fileName: (format) => `nanojet.${format}.js`,
    },
    rollupOptions: {
      external: [], // List external dependencies here if any
      output: {
        globals: {}, // Provide global variables for UMD build here if needed
      },
    },
  },
});
