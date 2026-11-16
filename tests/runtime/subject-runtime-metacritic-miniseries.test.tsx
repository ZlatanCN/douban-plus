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

describe("SubjectPageRuntime Metacritic", () => {
  setupSubjectRuntimeHooks();

  it("requires an explicit Queen's Gambit season link when Wikidata has no Metacritic season ID", async () => {
    const requests: string[] = [];
    const seriesUrl = "https://www.metacritic.com/tv/the-queens-gambit/";
    const seasonUrl =
      "https://www.metacritic.com/tv/the-queens-gambit/season-1/";
    const canonicalSeasonUrl =
      "https://www.metacritic.com/tv/the-queens-gambit/season-01/";
    let hasSeasonLink = true;
    mockNetwork((url) => {
      requests.push(url);
      if (url === "https://graphql.imdb.com/") {
        return {
          body: JSON.stringify({
            data: {
              title: {
                id: "tt10048342",
                ratingsSummary: { aggregateRating: 8.5, voteCount: 250_000 },
                titleText: { text: "The Queen's Gambit" },
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
                  identifier.includes("P345=tt10048342") ||
                  identifier.includes("P4529=32579283")
                    ? [{ title: "Q85808226" }]
                    : [],
              },
            }),
          };
        }
        const ids = (requestUrl.searchParams.get("ids") ?? "").split("|");
        const entities: Record<string, unknown> = {};
        if (ids.includes("Q85808226")) {
          entities.Q85808226 = {
            claims: {
              P31: [makeClaim({ id: "Q1259759" })],
              P345: [makeClaim("tt10048342")],
              P1712: [makeClaim("tv/the-queens-gambit")],
              P527: [
                {
                  ...makeClaim({ id: "Q125208437" }),
                  qualifiers: { P1545: [makeClaim("1")] },
                },
              ],
            },
            id: "Q85808226",
          };
        }
        if (ids.includes("Q125208437")) {
          entities.Q125208437 = {
            claims: {
              P31: [makeClaim({ id: "Q3464665" })],
              P1545: [makeClaim("1")],
              P179: [makeClaim({ id: "Q85808226" })],
            },
            id: "Q125208437",
          };
        }
        return { body: JSON.stringify({ entities }) };
      }
      if (url === seriesUrl) {
        const seasonLink = hasSeasonLink
          ? '<a href="/tv/the-queens-gambit/season-1/">Season 1</a>'
          : "";
        return {
          body: `<link rel="canonical" href="${seriesUrl}">${seasonLink}<script type="application/ld+json">{"@context":"https://schema.org","@type":"TVSeries","name":"The Queen's Gambit","datePublished":"2020-10-23","aggregateRating":{"@type":"AggregateRating","ratingValue":55,"reviewCount":7}}</script>`,
        };
      }
      if (url === seasonUrl || url === canonicalSeasonUrl) {
        return {
          body: `<link rel="canonical" href="${canonicalSeasonUrl}"><script type="application/ld+json">{"@context":"https://schema.org","@type":"TVSeason","name":"The Queen's Gambit: Season 1","seasonNumber":1,"partOfSeries":{"@type":"TVSeries","name":"The Queen's Gambit","url":"${seriesUrl}"},"aggregateRating":{"@type":"AggregateRating","ratingValue":79,"reviewCount":28}}</script>`,
          finalUrl: canonicalSeasonUrl,
        };
      }
      return { body: "", status: 404 };
    });
    const data = makeData({
      info: {
        ...makeData().info,
        firstAired: "2020-10-23",
        imdb: "tt10048342",
        selectedSeason: "Season 1",
      },
      isTV: true,
      subjectId: "32579283",
      title: {
        full: "后翼弃兵 The Queen's Gambit Season 1",
        original: "The Queen's Gambit Season 1",
        primary: "后翼弃兵",
        seasonLabel: "Season 1",
      },
      year: "2020",
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );

    await vi.waitFor(() =>
      expect(
        root.querySelector(".atv-rating-panel-mc .atv-rating-panel-score")
          ?.textContent
      ).toBe("79")
    );
    expect(requests).toContain(seriesUrl);
    expect(requests).toContain(seasonUrl);
    expect(
      root.querySelector<HTMLAnchorElement>(".atv-metacritic-source")?.href
    ).toBe(canonicalSeasonUrl);

    render(null, root);
    localStorage.clear();
    requests.length = 0;
    hasSeasonLink = false;
    const withoutLink = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );
    await vi.waitFor(() =>
      expect(withoutLink.querySelector(".atv-rating-panel-mc")).toBeNull()
    );
    expect(requests).toContain(seriesUrl);
    expect(requests).not.toContain(seasonUrl);
  });
});
