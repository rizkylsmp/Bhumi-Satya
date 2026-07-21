import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import process from "node:process";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxyTarget =
    env.VITE_API_PROXY_TARGET || "http://127.0.0.1:5000";

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on("error", (error, req, res) => {
              console.warn(
                `API proxy error for ${req.url}: ${error.message}`,
              );
              if (!res.headersSent) {
                res.writeHead(503, { "Content-Type": "application/json" });
              }
              res.end(
                JSON.stringify({
                  success: false,
                  error: `API backend unavailable at ${apiProxyTarget}`,
                }),
              );
            });
          },
        },
      },
    },
  };
});
