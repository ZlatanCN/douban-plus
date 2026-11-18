import { render } from "preact";
import { describe, expect, it, vi } from "vitest";

import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import { renderIntoRoot } from "../helpers/render";
import {
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

describe("SubjectPageRuntime fixed rating sample", () => {
  setupSubjectRuntimeHooks();

  it("extracts the pinned Douban identity fragment and renders both captured provider pages", async () => {
    const data = sampleData();
    expect(data).toMatchObject({
      isTV: false,
      subjectId: sample.work.doubanSubjectId,
      title: {
        full: "肖申克的救赎 The Shawshank Redemption",
        original: "The Shawshank Redemption",
      },
      year: "1994",
    });

    const requests: string[] = [];
    mockSampleNetwork(null, requests);
    const root = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );

    await vi.waitFor(() => {
      expect(visibleRtScores(root)).toStrictEqual([
        `${sample.expected.rottenTomatoes.criticsScore}%`,
        `${sample.expected.rottenTomatoes.audienceScore}%`,
      ]);
      expect(
        root.querySelector(".atv-rating-panel-mc .atv-rating-panel-score")
          ?.textContent
      ).toBe(String(sample.expected.metacritic.score));
    });
    expect(requests).toContain(sample.sources.rottenTomatoes.url);
    expect(root.querySelector<HTMLAnchorElement>(".atv-rt-source")?.href).toBe(
      sample.expected.rottenTomatoes.sourceUrl
    );
    expect(requests).toContain(sample.sources.metacritic.url);
    expect(
      root.querySelector<HTMLAnchorElement>(".atv-metacritic-source")?.href
    ).toBe(sample.expected.metacritic.sourceUrl);
    render(null, root);
  });
});
