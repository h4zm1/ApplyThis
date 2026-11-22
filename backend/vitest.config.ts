import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // runes before every test file
    setupFiles: ["./src/tests/guard.ts"],
    // test files share one database, so run them one at a time
    fileParallelism: false,
  },
});
