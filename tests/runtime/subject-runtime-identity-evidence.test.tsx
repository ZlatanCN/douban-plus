import { describe, expect, it, vi } from "vitest";

import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import { renderIntoRoot } from "../helpers/render";
import {
  animatedMovieData,
  mockAnimatedMovieNetwork,
  mockSeveranceNetwork,
  severanceData,
} from "./subject-runtime-identity-evidence-test-support";
import { setupSubjectRuntimeHooks } from "./subject-runtime-test-utils";

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = vi.fn<
    NonNullable<typeof globalThis.GM_xmlhttpRequest>
  >() as never;
});

describe("subject runtime shared Wikidata identity evidence", () => {
  setupSubjectRuntimeHooks();

  it("resolves an animated film whose P31 is anime film through its film ancestry", async () => {
    mockAnimatedMovieNetwork();
    const root = renderIntoRoot(
      <SubjectPageRuntime data={animatedMovieData()} doc={document} />
    );

    await vi.waitFor(() => {
      expect(
        [...root.querySelectorAll(".atv-rt-score-value")].map((node) =>
          node.textContent?.trim()
        )
      ).toStrictEqual(["97%", "96%"]);
      expect(
        root.querySelector(".atv-rating-panel-mc .atv-rating-panel-score")
          ?.textContent
      ).toBe("96");
    });
  });

  it("ablation: an unsupported P31 value does not inherit the animated-film mapping", async () => {
    mockAnimatedMovieNetwork("Q999999");
    const root = renderIntoRoot(
      <SubjectPageRuntime data={animatedMovieData()} doc={document} />
    );

    await vi.waitFor(() => {
      expect(root.querySelector(".atv-rating-panel-rt")).toBeNull();
      expect(root.querySelector(".atv-rating-panel-mc")).toBeNull();
    });
    expect(root.querySelector(".atv-rt-score-value")).toBeNull();
  });

  it("recognizes an s-leading RT slug as a series because it has no season path segment", async () => {
    mockSeveranceNetwork();
    const root = renderIntoRoot(
      <SubjectPageRuntime data={severanceData()} doc={document} />
    );

    await vi.waitFor(() => {
      expect(
        [...root.querySelectorAll(".atv-rt-score-value")].map((node) =>
          node.textContent?.trim()
        )
      ).toStrictEqual(["95%", "88%"]);
      expect(
        root.querySelector(".atv-rating-panel-mc .atv-rating-panel-score")
          ?.textContent
      ).toBe("85");
    });
  });

  it("ablation: an exact season path segment is not accepted as the same series", async () => {
    mockSeveranceNetwork("tv/severance/s01", "tv/severance/season-1");
    const root = renderIntoRoot(
      <SubjectPageRuntime data={severanceData()} doc={document} />
    );

    await vi.waitFor(() => {
      expect(root.querySelector(".atv-rating-panel-rt")).toBeNull();
      expect(root.querySelector(".atv-rating-panel-mc")).toBeNull();
    });
    expect(root.querySelector(".atv-rt-score-value")).toBeNull();
  });
});
