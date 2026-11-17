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

const snapshotKey = "dp:metacritic-snapshots:v2";
const audienceFailurePage = godfather.replaceAll(
  "/user-reviews/",
  "/other-user-reviews/"
);

const userTbdPage = (): string => {
  const page = new DOMParser().parseFromString(godfather, "text/html");
  for (const card of page.querySelectorAll<HTMLElement>(
    '[data-testid="global-score-wrapper"]'
  )) {
    if (
      card
        .querySelector('[data-testid="global-score-header"]')
        ?.textContent?.trim() !== "User score"
    ) {
      continue;
    }
    card.querySelector('[data-testid="global-score-review-count"]')?.remove();
    const sentiment = card.querySelector(
      '[data-testid="global-score-sentiment"]'
    );
    if (sentiment) {
      sentiment.textContent = "Available after 4 ratings";
    }
    const value = card.querySelector<HTMLElement>(
      '[data-testid="global-score-value-wrapper"]'
    );
    if (value) {
      value.setAttribute("aria-label", "User score TBD");
      value.title = "User score TBD";
      value.innerHTML = '<span data-testid="global-score-tbd">tbd</span>';
    }
  }
  const jsonLd = page.querySelector('script[type="application/ld+json"]');
  if (jsonLd?.textContent) {
    const entry = JSON.parse(jsonLd.textContent) as {
      aggregateRating: { ratingValue: number };
    };
    entry.aggregateRating.ratingValue = 91;
    jsonLd.textContent = JSON.stringify(entry);
  }
  return page.documentElement.outerHTML;
};

const latestMcUpdate = (updates: RatingUpdate[]) =>
  updates.findLast((update) => update.source === "mc");

describe("SubjectPageRuntime Metacritic atomic snapshots", () => {
  setupSubjectRuntimeHooks();

  it("shows a confirmed critic side after partial failure without replacing or renewing the snapshot", async () => {
    let now = Date.UTC(2026, 10, 17);
    vi.spyOn(Date, "now").mockImplementation(() => now);
    mockGodfatherNetwork();
    const firstRoot = renderIntoRoot(
      <SubjectPageRuntime data={godfatherData()} doc={document} />
    );
    await vi.waitFor(() =>
      expect(
        firstRoot.querySelector(".atv-mc-audience .atv-mc-score-value")
          ?.textContent
      ).toBe("9.1")
    );
    const savedSnapshot = localStorage.getItem(snapshotKey);
    render(null, firstRoot);

    now += 8 * 24 * 60 * 60 * 1000;
    const updates: RatingUpdate[] = [];
    mockGodfatherNetwork(audienceFailurePage);
    const refreshedRoot = renderIntoRoot(
      <SubjectPageRuntime
        data={godfatherData()}
        doc={document}
        onRatingUpdate={(update) => updates.push(update)}
      />
    );
    await vi.waitFor(() =>
      expect(latestMcUpdate(updates)?.result.diagnostic).toMatchObject({
        errorCode: "user-score-identity",
        reason: "parse-error",
      })
    );
    expect({
      savedSnapshotPresent: savedSnapshot !== null,
      criticsScore: refreshedRoot.querySelector(
        ".atv-mc-critics .atv-mc-score-value"
      )?.textContent,
      audience: refreshedRoot.querySelector(".atv-mc-audience"),
      currentSnapshot: localStorage.getItem(snapshotKey),
      rating: latestMcUpdate(updates)?.result.rating,
    }).toMatchObject({
      savedSnapshotPresent: true,
      criticsScore: "90",
      audience: null,
      currentSnapshot: savedSnapshot,
      rating: {
        audience: null,
        critics: { reviewCount: 18, score: 90 },
      },
    });
    render(null, refreshedRoot);
  });

  it("replaces a dual snapshot with the current single-side TBD response", async () => {
    let now = Date.UTC(2026, 10, 17);
    vi.spyOn(Date, "now").mockImplementation(() => now);
    mockGodfatherNetwork();
    const firstRoot = renderIntoRoot(
      <SubjectPageRuntime data={godfatherData()} doc={document} />
    );
    await vi.waitFor(() =>
      expect(
        firstRoot.querySelector(".atv-mc-audience .atv-mc-score-value")
          ?.textContent
      ).toBe("9.1")
    );
    render(null, firstRoot);

    now += 8 * 24 * 60 * 60 * 1000;
    const updates: RatingUpdate[] = [];
    mockGodfatherNetwork(userTbdPage());
    const refreshedRoot = renderIntoRoot(
      <SubjectPageRuntime
        data={godfatherData()}
        doc={document}
        onRatingUpdate={(update) => updates.push(update)}
      />
    );
    await vi.waitFor(() =>
      expect(
        refreshedRoot.querySelector(".atv-mc-critics .atv-mc-score-value")
          ?.textContent
      ).toBe("91")
    );
    const snapshots = JSON.parse(
      localStorage.getItem(snapshotKey) ?? "{}"
    ) as Record<
      string,
      {
        audience: unknown;
        critics: { reviewCount: number; score: number };
        fetchedAt: number;
      }
    >;
    const [snapshot] = Object.values(snapshots);
    expect({
      audience: refreshedRoot.querySelector(".atv-mc-audience"),
      snapshot,
      diagnostic: latestMcUpdate(updates)?.result.diagnostic?.reason,
    }).toMatchObject({
      audience: null,
      snapshot: {
        audience: null,
        critics: { reviewCount: 18, score: 91 },
        fetchedAt: now,
      },
      diagnostic: "rating",
    });
    render(null, refreshedRoot);
  });
});
