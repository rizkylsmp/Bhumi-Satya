import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import cesium from "vite-plugin-cesium";
import process from "node:process";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxyTarget =
    env.VITE_API_PROXY_TARGET || "http://127.0.0.1:5000";
  const buildId =
    env.VITE_BUILD_ID ||
    process.env.COOLIFY_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    new Date().toISOString();
  const buildMetadataPlugin = {
    name: "bhumi-satya-build-metadata",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "build.json",
        source: JSON.stringify({ buildId }),
      });
    },
  };

  return {
    define: {
      "import.meta.env.VITE_BUILD_ID": JSON.stringify(buildId),
    },
    plugins: [
      react(),
      tailwindcss(),
      cesium({ rebuildCesium: true }),
      buildMetadataPlugin,
    ],
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
