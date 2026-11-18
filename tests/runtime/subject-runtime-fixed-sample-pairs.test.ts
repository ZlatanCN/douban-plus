import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import runtimePairManifest from "../fixtures/external-ratings/v1/runtime-pairs.json";

describe("fixed sample runtime pairs", () => {
  it.each(runtimePairManifest.pairs)(
    "links $id to its same-sample SubjectPageRuntime pair",
    async (pair) => {
      expect(pair.testRefs.length).toBeGreaterThan(0);
      const sourceFiles = await Promise.all(
        pair.testRefs.map(async (reference) => ({
          reference,
          source: await readFile(
            path.resolve(process.cwd(), reference.file),
            "utf-8"
          ),
        }))
      );
      for (const { reference, source } of sourceFiles) {
        expect(source).toContain(reference.case);
      }
      const fragments =
        ("sourceFragments" in pair ? pair.sourceFragments : undefined) ?? [];
      const capturedFragments = await Promise.all(
        fragments.map((fragment) =>
          readFile(path.resolve(process.cwd(), fragment), "utf-8")
        )
      );
      expect(capturedFragments).toHaveLength(fragments.length);
    }
  );
});
