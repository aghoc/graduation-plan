import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const desktopDirectory = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: desktopDirectory,
  base: "./",
  plugins: [react()],
  server: {
    host: process.env.TAURI_DEV_HOST || "127.0.0.1",
    port: 1420,
    strictPort: true,
  },
  build: {
    outDir: resolve(desktopDirectory, "../desktop-dist"),
    emptyOutDir: true,
    target: process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari13",
  },
});
