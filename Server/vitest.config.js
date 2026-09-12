import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    globalSetup: ["./tests/globalSetup.js"],
    setupFiles: ["./tests/setup.js"],
    testTimeout: 30000,
    // Downloading the MongoDB binary on a cold cache can take a while.
    hookTimeout: 120000,
    // Tests share one in-memory MongoDB instance and must run sequentially
    // against it — concurrent test files would race on the same collections
    // via the shared afterEach cleanup.
    fileParallelism: false,
  },
});
