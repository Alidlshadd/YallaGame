import { defineConfig } from "vite"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: ".",
  publicDir: "public",
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
    sourcemap: true,
    // The service worker reads this to precache every content-hashed chunk,
    // including the lazily imported views. Named without the leading dot of
    // Vite's default path because express.static refuses to serve dotfiles.
    manifest: "asset-manifest.json"
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "src/shared"),
      "@client": path.resolve(__dirname, "src/client")
    }
  },
  server: {
    port: 5173,
    proxy: {
      "/socket.io": { target: "http://localhost:3000", ws: true },
      "/api":       { target: "http://localhost:3000" }
    }
  }
})
