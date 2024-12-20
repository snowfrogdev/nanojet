import { defineConfig } from "vite";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    open: true,
    fs: {
      allow: [
        // Allow serving files from the project root and engine package
        path.resolve(__dirname, "..", "engine"),
        path.resolve(__dirname, "..", "game"),
      ],
    },
  },
  resolve: {
    alias: {
      nanojet:
        mode === "production"
          ? path.resolve(__dirname, "../engine/dist/nanojet.es.js")
          : path.resolve(__dirname, "../engine/src"),
    },
  },
  build: {
    target: "esnext",
    base: "./",
  },
}));
