import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

// Integration tests that need a running Supabase stack; see tests/db.
// Only TEST_* variables are loaded from .env.local, so app secrets never reach the tests.
export default defineConfig(({ mode }) => ({
  test: {
    environment: "node",
    include: ["tests/db/**/*.test.ts"],
    env: loadEnv(mode, process.cwd(), "TEST_"),
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
}));
