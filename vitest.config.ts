import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

try {
  const envLocalPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envLocalPath)) {
    const envLocal = fs.readFileSync(envLocalPath, "utf-8");
    for (const line of envLocal.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const firstEqual = trimmed.indexOf("=");
      if (firstEqual === -1) continue;
      const key = trimmed.slice(0, firstEqual).trim();
      let val = trimmed.slice(firstEqual + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      } else if (val.startsWith("'") && val.endsWith("'")) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
} catch (e) {
  console.error("Failed to load .env.local manually:", e);
}

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.ts",
    testTimeout: 120000,
    hookTimeout: 120000,
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
