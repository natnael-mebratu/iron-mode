import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execSync } from "node:child_process";
import { VitePWA } from "vite-plugin-pwa";

// Shown on the Profile screen so it's easy to tell which version a phone is running.
function buildLabel() {
  let sha = "dev";
  try {
    sha = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    /* not a git checkout */
  }
  return `${sha} · ${new Date().toISOString().slice(0, 10)}`;
}

// GitHub Pages serves the site from https://<user>.github.io/iron-mode/.
// Using the same base locally means dev and preview match production.
export default defineConfig({
  base: "/iron-mode/",
  define: { __BUILD__: JSON.stringify(buildLabel()) },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "IRON MODE",
        short_name: "IRON MODE",
        description: "Workout tracker built around the equipment at your gym.",
        id: "/iron-mode/",
        lang: "en",
        categories: ["health", "fitness"],
        theme_color: "#111214",
        background_color: "#111214",
        display: "standalone",
        orientation: "portrait",
        start_url: "/iron-mode/",
        scope: "/iron-mode/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // App shell and the user's own gym photos are cached on install.
        globPatterns: ["**/*.{js,css,html,svg,png,jpg}"],
        runtimeCaching: [
          {
            // Optional demo photos: cached once viewed, so they work offline afterwards.
            urlPattern: /^https:\/\/raw\.githubusercontent\.com\/yuhonas\/free-exercise-db\//,
            handler: "CacheFirst",
            options: {
              cacheName: "demo-photos",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 180 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
