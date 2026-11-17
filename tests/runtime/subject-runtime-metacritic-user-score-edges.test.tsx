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

const currentUserCards = (page: Document): HTMLElement[] =>
  [
    ...page.querySelectorAll<HTMLElement>(
      '[data-testid="global-score-wrapper"]'
    ),
  ].filter(
    (card) =>
      card
        .querySelector('[data-testid="global-score-header"]')
        ?.textContent?.trim() === "User score"
  );

const replaceMetacriticHtml = (change: (page: Document) => void): string => {
  const page = new DOMParser().parseFromString(godfather, "text/html");
  change(page);
  return page.documentElement.outerHTML;
};

const latestMcUpdate = (updates: RatingUpdate[]) =>
  updates.findLast((update) => update.source === "mc");

describe("SubjectPageRuntime Metacritic User score edge cases", () => {
  setupSubjectRuntimeHooks();

  it("keeps a published zero and its native decimal display", async () => {
    const page = replaceMetacriticHtml((doc) => {
      for (const card of currentUserCards(doc)) {
        const value = card.querySelector<HTMLElement>(
          '[data-testid="global-score-value"]'
        );
        const wrapper = card.querySelector<HTMLElement>(
          '[data-testid="global-score-value-wrapper"]'
        );
        if (value) {
          value.textContent = "0.0";
        }
        if (wrapper) {
          wrapper.setAttribute("aria-label", "User score 0 out of 10");
          wrapper.title = "User score 0 out of 10";
        }
      }
    });
    const updates: RatingUpdate[] = [];
    mockGodfatherNetwork(page);
    const root = renderIntoRoot(
      <SubjectPageRuntime
        data={godfatherData()}
        doc={document}
        onRatingUpdate={(update) => updates.push(update)}
      />
    );

    await vi.waitFor(() =>
      expect(
        root.querySelector(".atv-mc-audience .atv-mc-score-value")?.textContent
      ).toBe("0.0")
    );
    expect(
      root.querySelector(".atv-mc-audience .atv-mc-score-scale")?.textContent
    ).toBe("/10");
    expect(latestMcUpdate(updates)?.result.rating).toMatchObject({
      audience: { displayScore: "0.0", reviewCount: 1269, score: 0 },
    });
    render(null, root);
  });

  it("keeps a valid User score when its rating count is absent", async () => {
    const page = replaceMetacriticHtml((doc) => {
      for (const card of currentUserCards(doc)) {
        const link = card.querySelector<HTMLAnchorElement>(
          'a[data-testid="global-score-review-count-link"]'
        );
        if (link) {
          link.textContent = "User Ratings";
        }
      }
    });
    const updates: RatingUpdate[] = [];
    mockGodfatherNetwork(page);
    const root = renderIntoRoot(
      <SubjectPageRuntime
        data={godfatherData()}
        doc={document}
        onRatingUpdate={(update) => updates.push(update)}
      />
    );

    await vi.waitFor(() =>
      expect(
        root.querySelector(".atv-mc-audience .atv-mc-score-value")?.textContent
      ).toBe("9.1")
    );
    expect(
      root.querySelector(".atv-mc-audience .atv-mc-rating-count")
    ).toBeNull();
    expect(latestMcUpdate(updates)?.result).toMatchObject({
      diagnostic: { reason: "rating" },
      rating: {
        audience: { displayScore: "9.1", reviewCount: null, score: 9.1 },
      },
    });
    render(null, root);
  });

  it("shows the User score by itself when Metascore is absent", async () => {
    const page = replaceMetacriticHtml((doc) => {
      const jsonLd = doc.querySelector('script[type="application/ld+json"]');
      if (jsonLd?.textContent) {
        const entry = JSON.parse(jsonLd.textContent) as Record<string, unknown>;
        delete entry.aggregateRating;
        jsonLd.textContent = JSON.stringify(entry);
      }
    });
    mockGodfatherNetwork(page);
    const root = renderIntoRoot(
      <SubjectPageRuntime data={godfatherData()} doc={document} />
    );

    await vi.waitFor(() =>
      expect(
        root.querySelector(".atv-mc-audience .atv-mc-score-value")?.textContent
      ).toBe("9.1")
    );
    expect(root.querySelector(".atv-mc-critics")).toBeNull();
    expect(
      root.querySelector(".atv-mc-audience .atv-mc-score-scale")?.textContent
    ).toBe("/10");
    render(null, root);
  });

  it("rejects a User score outside its native 0–10 range", async () => {
    const page = replaceMetacriticHtml((doc) => {
      for (const card of currentUserCards(doc)) {
        const value = card.querySelector<HTMLElement>(
          '[data-testid="global-score-value"]'
        );
        const wrapper = card.querySelector<HTMLElement>(
          '[data-testid="global-score-value-wrapper"]'
        );
        if (value) {
          value.textContent = "10.1";
        }
        if (wrapper) {
          wrapper.setAttribute("aria-label", "User score 10.1 out of 10");
          wrapper.title = "User score 10.1 out of 10";
        }
      }
    });
    const updates: RatingUpdate[] = [];
    mockGodfatherNetwork(page);
    const root = renderIntoRoot(
      <SubjectPageRuntime
        data={godfatherData()}
        doc={document}
        onRatingUpdate={(update) => updates.push(update)}
      />
    );

    await vi.waitFor(() =>
      expect(latestMcUpdate(updates)?.result.diagnostic?.reason).toBe(
        "parse-error"
      )
    );
    expect(
      root.querySelector(".atv-mc-critics .atv-mc-score-value")?.textContent
    ).toBe("90");
    expect(root.querySelector(".atv-mc-audience")).toBeNull();
    expect(latestMcUpdate(updates)?.result.rating).toMatchObject({
      audience: null,
      critics: { displayScore: "90", reviewCount: 18, score: 90 },
    });
    render(null, root);
  });
});
