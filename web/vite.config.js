import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  server: {
    port: 5173,
    open: true,
    // Ready for IWA spike later — proxy /api to inmation Web API
    proxy: {
      "/api": {
        target: "https://byus00876m1.bayer.cnb:8002",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
