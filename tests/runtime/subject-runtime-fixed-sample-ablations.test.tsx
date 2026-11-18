import { render } from "preact";
import { describe, expect, it, vi } from "vitest";

import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import { renderIntoRoot } from "../helpers/render";
import {
  assertSourceOutcomes,
  mockSampleNetwork,
  sample,
  sampleData,
  visibleRtScores,
} from "./subject-runtime-fixed-samples-test-support";
import { setupSubjectRuntimeHooks } from "./subject-runtime-test-utils";

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = vi.fn<
    NonNullable<typeof globalThis.GM_xmlhttpRequest>
  >() as never;
});

describe("SubjectPageRuntime fixed sample ablations", () => {
  setupSubjectRuntimeHooks();

  it.each(sample.controlledVariants)(
    "pairs the full source sample with the $id ablation",
    async (variant) => {
      const fullRequests: string[] = [];
      mockSampleNetwork(null, fullRequests);
      const fullRoot = renderIntoRoot(
        <SubjectPageRuntime data={sampleData()} doc={document} />
      );
      await vi.waitFor(() => {
        expect(visibleRtScores(fullRoot)).toStrictEqual([
          `${sample.expected.rottenTomatoes.criticsScore}%`,
          `${sample.expected.rottenTomatoes.audienceScore}%`,
        ]);
        expect(
          fullRoot.querySelector(".atv-rating-panel-mc .atv-rating-panel-score")
            ?.textContent
        ).toBe(String(sample.expected.metacritic.score));
      });
      expect(fullRequests).toContain(sample.sources.rottenTomatoes.url);
      expect(fullRequests).toContain(sample.sources.metacritic.url);
      render(null, fullRoot);

      localStorage.clear();
      const ablatedRequests: string[] = [];
      mockSampleNetwork(variant.id, ablatedRequests);
      const ablatedRoot = renderIntoRoot(
        <SubjectPageRuntime data={sampleData()} doc={document} />
      );
      await assertSourceOutcomes(
        ablatedRoot,
        ablatedRequests,
        variant.expected
      );
      render(null, ablatedRoot);
    }
  );
});
