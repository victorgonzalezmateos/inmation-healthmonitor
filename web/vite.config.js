import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  server: {
    port: 5173,
    open: true,
    // Proxy Bearer API calls to inmation Web API (IWA authorize uses host directly)
    proxy: {
      "/api": {
        target: "https://byus00876m1.bayer.cnb:8002",
        changeOrigin: true,
        secure: false,
      },
      "/apps": {
        target: "https://byus00876m1.bayer.cnb:8002",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
