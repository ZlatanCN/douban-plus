import { render } from "preact";
import { describe, expect, it, vi } from "vitest";

import type { RatingUpdate } from "@/modules/subject/resolve/orchestrate";
import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import crewGirl from "../fixtures/metacritic/crew-girl-season-1-tbd.html?raw";
import { renderIntoRoot } from "../helpers/render";
import {
  makeData,
  mockNetwork,
  setupSubjectRuntimeHooks,
} from "./subject-runtime-test-utils";

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = vi.fn<
    NonNullable<typeof globalThis.GM_xmlhttpRequest>
  >() as never;
});

const targetUrl = "https://www.metacritic.com/tv/crew-girl/season-1/";
const subjectId = "37516033";
const imdbId = "tt38218082";
const now = Date.UTC(2026, 10, 17);

const crewGirlData = () =>
  makeData({
    info: {
      ...makeData().info,
      firstAired: "2026-11-16",
      imdb: imdbId,
      selectedSeason: "Season 1",
    },
    isTV: true,
    subjectId,
    title: {
      full: "Crew Girl Season 1",
      original: "Crew Girl",
      primary: "Crew Girl",
      seasonLabel: "Season 1",
    },
    year: "2026",
  });

const seedControlledCrewGirlTarget = (): void => {
  const target = {
    identityReferences: { creators: [], directors: [] },
    kind: "season",
    metacriticId: "tv/crew-girl/season-1",
    season: 1,
    seriesId: "Q141155312",
    seriesMetacriticId: "tv/crew-girl",
    status: "matched",
  };
  localStorage.setItem(
    "dp:metacritic-targets:v4",
    JSON.stringify([
      [
        JSON.stringify([subjectId, imdbId, "season", 1]),
        {
          expiresAt: now + 30 * 24 * 60 * 60 * 1000,
          value: { status: "resolved", target, verifiedAt: now },
        },
      ],
    ])
  );
};

describe("SubjectPageRuntime Metacritic TBD state", () => {
  setupSubjectRuntimeHooks();

  it("accepts the captured no-link TBD card after verifying its season page", async () => {
    vi.spyOn(Date, "now").mockReturnValue(now);
    const capturedPage = new DOMParser().parseFromString(crewGirl, "text/html");
    // The real fixture remains mapping-missing. This synthetic cache entry only
    // reaches the parser; it does not claim a real Crew Girl Meta mapping.
    seedControlledCrewGirlTarget();
    const requests: string[] = [];
    const updates: RatingUpdate[] = [];
    mockNetwork((url) => {
      requests.push(url);
      return url === targetUrl ? { body: crewGirl } : { body: "", status: 404 };
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime
        data={crewGirlData()}
        doc={document}
        onRatingUpdate={(update) => updates.push(update)}
      />
    );

    await vi.waitFor(() =>
      expect(
        updates.findLast((update) => update.source === "mc")?.result.diagnostic
          ?.reason
      ).toBe("rating")
    );
    const [ratingSnapshot] = Object.values(
      JSON.parse(
        localStorage.getItem("dp:metacritic-snapshots:v2") ?? "{}"
      ) as Record<string, { audience: unknown }>
    );
    expect({
      nativeTbd: capturedPage.querySelector('[data-testid="global-score-tbd"]')
        ?.textContent,
      noReviewLink: capturedPage.querySelector(
        '[data-testid="global-score-review-count-link"]'
      ),
      criticsScore: root.querySelector(".atv-mc-critics .atv-mc-score-value")
        ?.textContent,
      audience: root.querySelector(".atv-mc-audience"),
      requestedPage: requests.includes(targetUrl),
      storedAudience: ratingSnapshot?.audience,
      diagnostic: updates.findLast((update) => update.source === "mc")?.result
        .diagnostic,
      rating: updates.findLast((update) => update.source === "mc")?.result
        .rating,
    }).toMatchObject({
      nativeTbd: "tbd",
      noReviewLink: null,
      criticsScore: "60",
      audience: null,
      requestedPage: true,
      storedAudience: null,
      diagnostic: { reason: "rating" },
      rating: {
        audience: null,
        critics: { reviewCount: 8, score: 60 },
        object: { kind: "season", season: 1, subjectId },
      },
    });
    render(null, root);
  });

  it.each([
    ["wrong-season", ' href="/tv/crew-girl/user-reviews/?season=season-2"'],
    ["missing-href", ""],
  ] as const)(
    "rejects a TBD card with a %s review link after verifying the season page",
    async (_kind, linkAttributes) => {
      vi.spyOn(Date, "now").mockReturnValue(now);
      seedControlledCrewGirlTarget();
      const page = new DOMParser().parseFromString(crewGirl, "text/html");
      for (const card of page.querySelectorAll<HTMLElement>(
        '[data-testid="global-score-wrapper"]'
      )) {
        if (
          card
            .querySelector('[data-testid="global-score-header"]')
            ?.textContent?.trim() === "User score"
        ) {
          card.insertAdjacentHTML(
            "beforeend",
            `<a data-testid="global-score-review-count-link"${linkAttributes}>Based on 4 User Ratings</a>`
          );
        }
      }
      const updates: RatingUpdate[] = [];
      mockNetwork((url) =>
        url === targetUrl
          ? { body: page.documentElement.outerHTML }
          : { body: "", status: 404 }
      );
      const root = renderIntoRoot(
        <SubjectPageRuntime
          data={crewGirlData()}
          doc={document}
          onRatingUpdate={(update) => updates.push(update)}
        />
      );

      await vi.waitFor(() =>
        expect(
          root.querySelector(".atv-mc-critics .atv-mc-score-value")?.textContent
        ).toBe("60")
      );
      expect({
        audience: root.querySelector(".atv-mc-audience"),
        diagnostic: updates.findLast((update) => update.source === "mc")?.result
          .diagnostic,
        snapshot: localStorage.getItem("dp:metacritic-snapshots:v2"),
      }).toMatchObject({
        audience: null,
        diagnostic: {
          errorCode: "user-score-identity",
          reason: "parse-error",
        },
        snapshot: null,
      });
      render(null, root);
    }
  );

  it("reports no rating only when the current page confirms both sides are unscored", async () => {
    vi.spyOn(Date, "now").mockReturnValue(now);
    seedControlledCrewGirlTarget();
    const page = new DOMParser().parseFromString(crewGirl, "text/html");
    const jsonLd = page.querySelector('script[type="application/ld+json"]');
    if (jsonLd?.textContent) {
      const entry = JSON.parse(jsonLd.textContent) as Record<string, unknown>;
      delete entry.aggregateRating;
      jsonLd.textContent = JSON.stringify(entry);
    }
    const updates: RatingUpdate[] = [];
    mockNetwork((url) =>
      url === targetUrl
        ? { body: page.documentElement.outerHTML }
        : { body: "", status: 404 }
    );
    const root = renderIntoRoot(
      <SubjectPageRuntime
        data={crewGirlData()}
        doc={document}
        onRatingUpdate={(update) => updates.push(update)}
      />
    );

    await vi.waitFor(() =>
      expect(
        updates.findLast((update) => update.source === "mc")?.result.diagnostic
          ?.reason
      ).toBe("source-no-rating")
    );
    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rating-panel-mc")).toBeNull()
    );
    expect(
      JSON.parse(localStorage.getItem("dp:metacritic-snapshots:v2") ?? "{}")
    ).toStrictEqual({});
    render(null, root);
  });
});
