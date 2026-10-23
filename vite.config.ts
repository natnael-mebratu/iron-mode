import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves the site from https://<user>.github.io/iron-mode/.
// Using the same base locally means dev and preview match production.
export default defineConfig({
  base: "/iron-mode/",
  plugins: [react()],
});
