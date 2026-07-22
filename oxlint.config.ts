import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";
import vitest from "ultracite/oxlint/vitest";

const restrictImports = (
  patterns: string[],
  message: string
): ["error", { patterns: { group: string[]; message: string }[] }] => [
  "error",
  { patterns: [{ group: patterns, message }] },
];

export default defineConfig({
  extends: [core, react, vitest],
  ignorePatterns: [...(core.ignorePatterns ?? []), ".agents"],
  overrides: [
    {
      files: ["src/main.ts"],
      rules: {
        "no-restricted-imports": restrictImports(
          ["@/modules/subject/**", "@/modules/personage/**"],
          "Import page modules only through their public entry point."
        ),
      },
    },
    {
      files: ["src/shared/**"],
      rules: {
        "no-restricted-imports": restrictImports(
          [
            "@/modules/subject",
            "@/modules/subject/**",
            "@/modules/personage",
            "@/modules/personage/**",
          ],
          "Shared code must not depend on page modules."
        ),
      },
    },
    {
      files: ["src/modules/subject/**"],
      rules: {
        "no-restricted-imports": restrictImports(
          ["@/modules/personage", "@/modules/personage/**"],
          "Page modules must not depend on each other."
        ),
      },
    },
    {
      files: ["src/modules/personage/**"],
      rules: {
        "no-restricted-imports": restrictImports(
          ["@/modules/subject", "@/modules/subject/**"],
          "Page modules must not depend on each other."
        ),
      },
    },
    {
      excludeFiles: [
        "src/main.ts",
        "src/shared/**",
        "src/modules/subject/**",
        "src/modules/personage/**",
      ],
      files: ["src/**"],
      rules: {
        "no-restricted-imports": restrictImports(
          [
            "@/modules/subject",
            "@/modules/subject/**",
            "@/modules/personage",
            "@/modules/personage/**",
          ],
          "Only src/main.ts may import page modules."
        ),
      },
    },
    {
      // Page-module tests intentionally exercise implementation seams.
      files: ["tests/**"],
      rules: {
        "no-restricted-imports": "off",
      },
    },
  ],
  rules: {
    // Module boundaries need importer-aware rules, so they are defined below.
    "no-restricted-imports": "off",
    "typescript/consistent-type-definitions": ["error", "type"],
  },
});
