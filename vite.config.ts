import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",     // expose to network
    port: 5173,          // choose any free port
    strictPort: true,    // fail if port is busy
    allowedHosts: [
      "dsp.plumuleresearch.co.in",
      "plumuleresearch.co.in",
      "localhost",
    ],
  },
});

