import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  plugins: [
    react()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        dashboard: path.resolve(__dirname, "dashboard.html"),
        pipeline: path.resolve(__dirname, "pipeline.html"),
        report: path.resolve(__dirname, "report.html"),
        settings: path.resolve(__dirname, "settings.html"),
      },
    },
  },
}));
