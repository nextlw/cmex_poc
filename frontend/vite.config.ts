import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./", // Garante caminhos relativos no HTML
  plugins: [react()],
  build: {
    rollupOptions: {
      // Remova a configuração `external`
      output: {
        manualChunks: undefined, // Para evitar divisão desnecessária de chunks
      },
    },
  },
  server: {
    open: true, // Abre o navegador automaticamente
  },
});
