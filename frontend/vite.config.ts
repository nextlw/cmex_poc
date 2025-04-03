import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  base: "./", // Garante caminhos relativos no HTML
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      // Remova a configuração `external`
      output: {
        manualChunks: undefined, // Para evitar divisão desnecessária de chunks
      },
    },
  },
  server: {
    port: 5173,
    open: true, // Abre o navegador automaticamente
  },
});
