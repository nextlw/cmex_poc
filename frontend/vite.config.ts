import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ["/assets/index-412d3335.js", "/assets/index-4d52487b.css"],
    },
  },
  server: {
    open: true,
  },
});
