import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";

export default defineConfig({
  extends: [core],
  ignorePatterns: core.ignorePatterns.filter(
    (pattern) => !pattern.includes("build")
  ),
  rules: {
    "typescript/consistent-type-definitions": ["error", "type"],
  },
});
