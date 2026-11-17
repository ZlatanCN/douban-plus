import { render } from "preact";
import { describe, expect, it, vi } from "vitest";

import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import { renderIntoRoot } from "../helpers/render";
import {
  makeClaim,
  makeData,
  mockNetwork,
  setupSubjectRuntimeHooks,
} from "./subject-runtime-test-utils";
import type { MockReply } from "./subject-runtime-test-utils";

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = vi.fn<
    NonNullable<typeof globalThis.GM_xmlhttpRequest>
  >() as never;
});

const makeMoviePage = (url: string, score: number): string =>
  `<link rel="canonical" href="${url}"><script type="application/ld+json">{"@context":"https://schema.org","@type":"Movie","name":"Spider-Man: Into the Spider-Verse","datePublished":"2018-12-14","aggregateRating":{"@type":"AggregateRating","ratingValue":${score},"reviewCount":50}}</script><div data-testid="global-score-wrapper"><div data-testid="global-score-header">User score</div><div data-testid="global-score-value-wrapper" aria-label="User score TBD" title="User score TBD"><span data-testid="global-score-tbd">tbd</span></div></div>`;

describe("SubjectPageRuntime Metacritic", () => {
  setupSubjectRuntimeHooks();

  it("does not let a late old Metacritic page restore a score after target conflict", async () => {
    const subjectId = "26374197";
    const imdbId = "tt4633694";
    const oldId = "movie/spider-man-into-the-spider-verse";
    const newId = "movie/spider-man-into-the-spider-verse-remastered";
    const oldUrl = `https://www.metacritic.com/${oldId}/`;
    const newUrl = `https://www.metacritic.com/${newId}/`;
    let now = Date.UTC(2026, 10, 16);
    vi.spyOn(Date, "now").mockImplementation(() => now);
    const oldTarget = {
      kind: "movie",
      identityReferences: { creators: [], directors: [] },
      metacriticId: oldId,
      season: null,
      seriesId: null,
      seriesMetacriticId: null,
      status: "matched",
    };
    localStorage.setItem(
      "dp:metacritic-targets:v4",
      JSON.stringify([
        [
          JSON.stringify([subjectId, imdbId, "movie", null]),
          {
            expiresAt: now + 30 * 24 * 60 * 60 * 1000,
            value: { status: "resolved", target: oldTarget, verifiedAt: now },
          },
        ],
      ])
    );
    let oldPageStarted = false;
    const oldPageRequest = Promise.withResolvers<MockReply>();
    mockNetwork((url) => {
      if (url === oldUrl) {
        oldPageStarted = true;
        return oldPageRequest.promise;
      }
      if (url === newUrl) {
        return { body: makeMoviePage(newUrl, 64), finalUrl: newUrl };
      }
      if (url === "https://graphql.imdb.com/") {
        return {
          body: JSON.stringify({
            data: {
              title: {
                id: imdbId,
                ratingsSummary: { aggregateRating: 8.4, voteCount: 50_000 },
                titleText: { text: "Spider-Man: Into the Spider-Verse" },
              },
            },
          }),
        };
      }
      if (url.includes("wikidata.org/w/api.php")) {
        const requestUrl = new URL(url);
        if (requestUrl.searchParams.get("action") === "query") {
          const identifier = requestUrl.searchParams.get("srsearch") ?? "";
          return {
            body: JSON.stringify({
              query: {
                search:
                  identifier.includes(`P345=${imdbId}`) ||
                  identifier.includes(`P4529=${subjectId}`)
                    ? [{ title: "Q29588607" }]
                    : [],
              },
            }),
          };
        }
        const entities: Record<string, unknown> = {};
        const ids = (requestUrl.searchParams.get("ids") ?? "").split("|");
        if (ids.includes("Q29588607")) {
          entities.Q29588607 = {
            claims: {
              P31: [makeClaim({ id: "Q202866" })],
              P1712: [makeClaim(newId)],
              P345: [makeClaim(imdbId)],
              P4529: [makeClaim(subjectId)],
            },
            id: "Q29588607",
          };
        }
        if (ids.includes("Q202866")) {
          entities.Q202866 = {
            claims: { P279: [makeClaim({ id: "Q11424" })] },
            id: "Q202866",
          };
        }
        return { body: JSON.stringify({ entities }) };
      }
      return { body: "", status: 404 };
    });
    const data = makeData({
      info: { ...makeData().info, imdb: imdbId },
      subjectId,
      title: {
        full: "蜘蛛侠：平行宇宙 Spider-Man: Into the Spider-Verse",
        original: "Spider-Man: Into the Spider-Verse",
        primary: "蜘蛛侠：平行宇宙",
        seasonLabel: "",
      },
      year: "2018",
    });
    const oldRoot = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );
    await vi.waitFor(() => expect(oldPageStarted).toBeTruthy());

    now += 25 * 60 * 60 * 1000;
    const newRoot = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );
    await vi.waitFor(() =>
      expect(
        newRoot.querySelector(".atv-rating-panel-mc .atv-rating-panel-score")
          ?.textContent
      ).toBe("64")
    );

    oldPageRequest.resolve({
      body: makeMoviePage(oldUrl, 90),
      finalUrl: oldUrl,
    });
    await vi.waitFor(() =>
      expect(
        oldRoot.querySelector(".atv-rating-panel-mc .atv-rating-panel-score")
          ?.textContent
      ).toBe("64")
    );
    expect(
      newRoot.querySelector(".atv-rating-panel-mc .atv-rating-panel-score")
        ?.textContent
    ).toBe("64");
    const snapshots = JSON.parse(
      localStorage.getItem("dp:metacritic-snapshots:v2") ?? "{}"
    ) as Record<string, { object?: { metacriticId?: string } }>;
    expect(
      Object.values(snapshots).map((rating) => rating.object?.metacriticId)
    ).toStrictEqual([newId]);
    render(null, oldRoot);
    render(null, newRoot);
  });
});
