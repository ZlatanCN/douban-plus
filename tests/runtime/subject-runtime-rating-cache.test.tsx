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

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = vi.fn<
    NonNullable<typeof globalThis.GM_xmlhttpRequest>
  >() as never;
});

describe("subject runtime rating cache", () => {
  setupSubjectRuntimeHooks();

  it("renders verified RT and Metacritic caches without refetching identity on reload", async () => {
    const requests: string[] = [];
    const rtUrl = "https://www.rottentomatoes.com/m/shawshank_redemption";
    const mcUrl = "https://www.metacritic.com/movie/the-shawshank-redemption/";
    let identityConflict = false;
    let now = Date.now();
    vi.spyOn(Date, "now").mockImplementation(() => now);
    mockNetwork((url) => {
      requests.push(url);
      if (url === "https://graphql.imdb.com/") {
        return {
          body: JSON.stringify({
            data: {
              title: {
                id: "tt0111161",
                ratingsSummary: { aggregateRating: 9.3, voteCount: 1_200_000 },
                titleText: { text: "The Shawshank Redemption" },
              },
            },
          }),
        };
      }
      if (url.includes("wikidata.org/w/api.php")) {
        const requestUrl = new URL(url);
        if (requestUrl.searchParams.get("action") === "query") {
          const identifier = requestUrl.searchParams.get("srsearch") ?? "";
          const doubanMatch = identifier.includes("P4529=1292052");
          return {
            body: JSON.stringify({
              query: {
                search: [
                  {
                    title: doubanMatch && identityConflict ? "Q555" : "Q172241",
                  },
                ],
              },
            }),
          };
        }
        const ids = (requestUrl.searchParams.get("ids") ?? "").split("|");
        const entities: Record<string, unknown> = {};
        if (ids.includes("Q172241")) {
          entities.Q172241 = {
            claims: {
              P1258: [makeClaim("m/shawshank_redemption")],
              P1712: [makeClaim("movie/the-shawshank-redemption")],
              P31: [makeClaim({ id: "Q11424" })],
              P345: [makeClaim("tt0111161")],
              P4529: [makeClaim("1292052")],
            },
            id: "Q172241",
          };
        }
        if (ids.includes("Q555")) {
          entities.Q555 = {
            claims: {
              P1258: [makeClaim("m/another-shawshank")],
              P1712: [makeClaim("movie/another-shawshank")],
              P31: [makeClaim({ id: "Q11424" })],
              P4529: [makeClaim("1292052")],
            },
            id: "Q555",
          };
        }
        return {
          body: JSON.stringify({ entities }),
        };
      }
      if (url === rtUrl) {
        return {
          body: `<link rel="canonical" href="${rtUrl}"><script type="application/ld+json">{"@type":"Movie"}</script><script type="application/json" data-json="mediaScorecard">{"criticsScore":{"scorePercent":"89%","ratingCount":147},"audienceScore":{"scorePercent":"98%","bandedRatingCount":"250,000+ Ratings"},"overlay":{"hasAudienceAll":true,"hasAudienceVerified":false,"audienceAll":{"scorePercent":"98%","bandedRatingCount":"250,000+ Ratings"}}}</script>`,
        };
      }
      if (url === mcUrl) {
        return {
          body: `<link rel="canonical" href="${mcUrl}"><script type="application/ld+json">{"@type":"Movie","aggregateRating":{"ratingValue":82,"reviewCount":22}}</script>`,
        };
      }
      return { body: "", status: 404 };
    });
    const data = makeData({
      info: { ...makeData().info, imdb: "tt0111161" },
      title: {
        full: "The Shawshank Redemption",
        original: "The Shawshank Redemption",
        primary: "肖申克的救赎",
        seasonLabel: "",
      },
    });
    const firstRoot = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );

    await vi.waitFor(() => {
      expect(
        [...firstRoot.querySelectorAll(".atv-rt-score-value")].map((node) =>
          node.textContent?.trim()
        )
      ).toStrictEqual(["89%", "98%"]);
      expect(
        firstRoot.querySelector(".atv-rating-panel-mc .atv-rating-panel-score")
          ?.textContent
      ).toBe("82");
      expect(
        firstRoot.querySelector<HTMLAnchorElement>(".atv-imdb-source")?.href
      ).toBe("https://www.imdb.com/title/tt0111161/");
      expect(
        firstRoot.querySelector<HTMLAnchorElement>(".atv-metacritic-source")
          ?.href
      ).toBe(mcUrl);
    });
    render(null, firstRoot);
    requests.length = 0;

    const secondRoot = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );
    await vi.waitFor(() => {
      expect(
        [...secondRoot.querySelectorAll(".atv-rt-score-value")].map((node) =>
          node.textContent?.trim()
        )
      ).toStrictEqual(["89%", "98%"]);
      expect(
        secondRoot.querySelector(".atv-rating-panel-mc .atv-rating-panel-score")
          ?.textContent
      ).toBe("82");
    });
    expect(requests).toStrictEqual([]);
    render(null, secondRoot);

    now += 8 * 24 * 60 * 60 * 1000;
    requests.length = 0;
    const expiredScoreRoot = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );
    await vi.waitFor(() => {
      expect(
        expiredScoreRoot.querySelector(
          ".atv-rating-panel-mc .atv-rating-panel-score"
        )?.textContent
      ).toBe("82");
      expect(
        requests.filter((url) => url.includes("wikidata.org/w/api.php"))
      ).toHaveLength(8);
    });
    expect(requests).toContain(mcUrl);
    render(null, expiredScoreRoot);

    identityConflict = true;
    now += 25 * 60 * 60 * 1000;
    requests.length = 0;
    const conflictRoot = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );
    await vi.waitFor(() =>
      expect(
        requests.filter((url) => url.includes("wikidata.org/w/api.php"))
      ).toHaveLength(8)
    );
    await vi.waitFor(() => {
      expect(conflictRoot.querySelector(".atv-rating-panel-rt")).toBeNull();
      expect(conflictRoot.querySelector(".atv-rating-panel-mc")).toBeNull();
    });
    render(null, conflictRoot);
  });
});
