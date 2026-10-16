import { defineConfig } from "vitest/config";

// The tests of firestore.rules (test/firestore.rules.spec.ts): in Node, against the Firestore emulator
export default defineConfig({
  test: {
    include: ["test/firestore.rules.spec.ts"],
    environment: "node",
    testTimeout: 20000,
  },
});
