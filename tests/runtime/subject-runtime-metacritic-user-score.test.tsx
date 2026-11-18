import { render } from "preact";
import { describe, expect, it, vi } from "vitest";

import type { RatingUpdate } from "@/modules/subject/resolve/orchestrate";
import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import godfather from "../fixtures/metacritic/godfather-part-ii-user-score.html?raw";
import { renderIntoRoot } from "../helpers/render";
import {
  godfatherData,
  mockGodfatherNetwork,
} from "./subject-runtime-metacritic-user-score-support";
import { setupSubjectRuntimeHooks } from "./subject-runtime-test-utils";

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = vi.fn<
    NonNullable<typeof globalThis.GM_xmlhttpRequest>
  >() as never;
});

describe("SubjectPageRuntime Metacritic User score", () => {
  setupSubjectRuntimeHooks();

  it("renders both native scales and rating counts from the verified page response", async () => {
    const updates: RatingUpdate[] = [];
    mockGodfatherNetwork();
    const root = renderIntoRoot(
      <SubjectPageRuntime
        data={godfatherData()}
        doc={document}
        onRatingUpdate={(update) => updates.push(update)}
      />
    );

    await vi.waitFor(() =>
      expect(
        root.querySelector(".atv-mc-audience .atv-mc-score-value")
      ).not.toBeNull()
    );
    const sideRows = [...root.querySelectorAll(".atv-mc-score-side")].map(
      (side) =>
        [...side.children].map((child) => {
          if (child.classList.contains("atv-mc-score-reading")) {
            return "reading";
          }
          if (child.classList.contains("atv-mc-score-label")) {
            return "label";
          }
          return "count";
        })
    );
    expect(sideRows).toStrictEqual([
      ["reading", "label", "count"],
      ["reading", "label", "count"],
    ]);
    const metaUpdate = updates.findLast(({ source }) => source === "mc");
    expect({
      critics: {
        score: root.querySelector(".atv-mc-critics .atv-mc-score-value")
          ?.textContent,
        scale: root.querySelector(".atv-mc-critics .atv-mc-score-scale")
          ?.textContent,
        count: root.querySelector(".atv-mc-critics .atv-mc-rating-count")
          ?.textContent,
      },
      audience: {
        score: root.querySelector(".atv-mc-audience .atv-mc-score-value")
          ?.textContent,
        scale: root.querySelector(".atv-mc-audience .atv-mc-score-scale")
          ?.textContent,
        count: root.querySelector(".atv-mc-audience .atv-mc-rating-count")
          ?.textContent,
      },
      noLegacyDescription: root.querySelector(".atv-mc-label-row") === null,
      rating: metaUpdate?.result,
    }).toMatchObject({
      critics: { score: "90", scale: "/100", count: "评价 18" },
      audience: { score: "9.1", scale: "/10", count: "评价 1,269" },
      noLegacyDescription: true,
      rating: {
        diagnostic: { reason: "rating" },
        rating: {
          critics: { reviewCount: 18, score: 90 },
          audience: { reviewCount: 1269, score: 9.1 },
        },
      },
    });

    render(null, root);
  });

  it("rejects a visible TBD marker paired with a labeled numeric zero", async () => {
    const page = new DOMParser().parseFromString(godfather, "text/html");
    for (const card of page.querySelectorAll<HTMLElement>(
      '[data-testid="global-score-wrapper"]'
    )) {
      if (
        card
          .querySelector('[data-testid="global-score-header"]')
          ?.textContent?.trim() === "User score"
      ) {
        const wrapper = card.querySelector<HTMLElement>(
          '[data-testid="global-score-value-wrapper"]'
        );
        const score = wrapper?.querySelector<HTMLElement>(
          '[data-testid="global-score-value"]'
        );
        if (wrapper && score) {
          score.textContent = "0.0";
          wrapper.setAttribute("aria-label", "User score 0.0 out of 10");
          wrapper.title = "User score 0.0 out of 10";
          wrapper.insertAdjacentHTML(
            "beforeend",
            '<span data-testid="global-score-tbd">tbd</span>'
          );
        }
      }
    }
    const updates: RatingUpdate[] = [];
    mockGodfatherNetwork(page.documentElement.outerHTML);
    const root = renderIntoRoot(
      <SubjectPageRuntime
        data={godfatherData()}
        doc={document}
        onRatingUpdate={(update) => updates.push(update)}
      />
    );

    await vi.waitFor(() =>
      expect(updates.findLast((update) => update.source === "mc")).toBeDefined()
    );
    expect({
      critics: root.querySelector(".atv-mc-critics .atv-mc-score-value")
        ?.textContent,
      audienceScore: root.querySelector(".atv-mc-audience .atv-mc-score-value")
        ?.textContent,
      audienceScale: root.querySelector(".atv-mc-audience .atv-mc-score-scale")
        ?.textContent,
      errorCode: updates.findLast((update) => update.source === "mc")?.result
        .diagnostic?.errorCode,
      snapshot: localStorage.getItem("dp:metacritic-snapshots:v2"),
    }).toStrictEqual({
      critics: "90",
      audienceScore: undefined,
      audienceScale: undefined,
      errorCode: "conflicting-user-score-state",
      snapshot: null,
    });
    render(null, root);
  });
});
