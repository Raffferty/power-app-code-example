import { fileURLToPath, URL } from "node:url";
import { defineConfig, defaultExclude } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    exclude: [...defaultExclude, "**/.claude/worktrees/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
