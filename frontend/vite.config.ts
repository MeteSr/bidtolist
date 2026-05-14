/// <reference types="vitest" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, ".."), "");

  return {
    plugins: [react()],
    envDir: path.resolve(__dirname, ".."),
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
    server: {
      port: 5174,
      proxy: {
        "/api": { target: "http://localhost:4943", changeOrigin: true },
      },
    },
    define: {
      "process.env.DFX_NETWORK":      JSON.stringify(env.DFX_NETWORK || "local"),
      "process.env.LISTING_CANISTER_ID": JSON.stringify(env.CANISTER_ID_LISTING || ""),
      "process.env.AGENT_CANISTER_ID":   JSON.stringify(env.CANISTER_ID_AGENT   || ""),
      "process.env.FEE_CANISTER_ID":     JSON.stringify(env.CANISTER_ID_FEE     || ""),
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/__tests__/setup.ts"],
      coverage: {
        provider: "v8",
        reporter: ["text", "json-summary"],
        reportsDirectory: "./coverage",
      },
    },
  };
});
