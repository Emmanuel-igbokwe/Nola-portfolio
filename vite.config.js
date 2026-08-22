import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Set base to your repo name if deploying to GitHub Pages at
// https://<username>.github.io/<repo-name>/  e.g. base: "/foodpulse-ai/"
export default defineConfig({
  plugins: [react()],
  base: "./",
});
