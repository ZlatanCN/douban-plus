import { render } from "preact";
import { describe, expect, it, vi } from "vitest";

import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import { renderIntoRoot } from "../helpers/render";
import {
  createRatingOutcomeCapture,
  mockNetwork,
  setupRatingOutcomeTest,
} from "./subject-runtime-rating-outcomes-test-support";
import { makeData } from "./subject-runtime-test-utils";

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = vi.fn<
    NonNullable<typeof globalThis.GM_xmlhttpRequest>
  >() as never;
});

describe("SubjectPageRuntime rating outcome boundary", () => {
  setupRatingOutcomeTest();

  it("keeps rating acquisition active without registering diagnostics menus", async () => {
    const { onRatingUpdate, outcomes } = createRatingOutcomeCapture();
    const registeredCaptions: string[] = [];
    const registerMenuCommand = vi.fn<
      (caption: string, onClick: () => void) => number
    >((caption) => {
      registeredCaptions.push(caption);
      return registeredCaptions.length;
    });
    vi.stubGlobal("GM", {
      getValue: vi.fn<(key: string, fallback: unknown) => Promise<unknown>>(
        (_key, fallback) => Promise.resolve(fallback)
      ),
      registerMenuCommand,
      setValue: vi.fn<(key: string, value: unknown) => Promise<void>>(() =>
        Promise.resolve()
      ),
      unregisterMenuCommand: vi.fn<(id: number) => void>(() => {}),
    });
    mockNetwork((url) =>
      url === "https://graphql.imdb.com/"
        ? {
            body: JSON.stringify({
              data: {
                title: {
                  id: "tt1234567",
                  ratingsSummary: { aggregateRating: 8.2, voteCount: 87 },
                  titleText: { text: "Diagnostic Test Film" },
                  titleType: { id: "movie" },
                },
              },
            }),
          }
        : { body: "", status: 404 }
    );
    const data = makeData({
      info: { ...makeData().info, imdb: "tt1234567" },
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime
        data={data}
        doc={document}
        onRatingUpdate={onRatingUpdate}
      />
    );

    await vi.waitFor(() => {
      expect(
        root.querySelector(".atv-rating-panel-imdb .atv-rating-panel-score")
          ?.textContent
      ).toBe("8.2");
      expect([...outcomes.keys()].toSorted()).toStrictEqual([
        "imdb",
        "mc",
        "rt",
      ]);
      for (const update of outcomes.values()) {
        expect(update.result.status).toBe("resolved");
      }
    });

    expect(registeredCaptions).not.toContain("评分诊断：开启");
    expect(registeredCaptions).not.toContain("评分诊断：复制本页报告");
    expect(outcomes.get("imdb")?.result.diagnostic).toMatchObject({
      reason: "rating",
      stage: "rating",
    });
    render(null, root);
  });
});
