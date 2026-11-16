import { render } from "preact";
import { describe, expect, it, vi } from "vitest";

import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import chernobylSeries from "../fixtures/metacritic/chernobyl-series.html?raw";
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

  it("follows an explicit Chernobyl season link when Wikidata only lists episodes", async () => {
    const requests: string[] = [];
    const seriesUrl = "https://www.metacritic.com/tv/chernobyl/";
    const seasonUrl = "https://www.metacritic.com/tv/chernobyl/season-1/";
    let hasSeasonLink = true;
    let seasonResponseUrl = seasonUrl;
    let seasonResponseNumber = 1;
    let seasonParentUrl = seriesUrl;
    mockNetwork((url) => {
      requests.push(url);
      if (url === "https://graphql.imdb.com/") {
        return {
          body: JSON.stringify({
            data: {
              title: {
                id: "tt7366338",
                ratingsSummary: { aggregateRating: 9.3, voteCount: 1_000_000 },
                titleText: { text: "Chernobyl" },
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
                search: identifier.includes("P345=tt7366338")
                  ? [{ title: "Q48741246" }]
                  : [],
              },
            }),
          };
        }
        const ids = (requestUrl.searchParams.get("ids") ?? "").split("|");
        const entities: Record<string, unknown> = {};
        if (ids.includes("Q48741246")) {
          entities.Q48741246 = {
            claims: {
              P31: [makeClaim({ id: "Q1259759" })],
              P345: [makeClaim("tt7366338")],
              P1712: [makeClaim("tv/chernobyl")],
              P527: [
                {
                  ...makeClaim({ id: "Q64160390" }),
                  qualifiers: { P1545: [makeClaim("1")] },
                },
              ],
            },
            id: "Q48741246",
          };
        }
        if (ids.includes("Q64160390")) {
          entities.Q64160390 = {
            claims: {
              P31: [makeClaim({ id: "Q21191270" })],
              P179: [makeClaim({ id: "Q48741246" })],
            },
            id: "Q64160390",
          };
        }
        return { body: JSON.stringify({ entities }) };
      }
      if (url === seriesUrl) {
        let body = chernobylSeries;
        if (!hasSeasonLink) {
          const page = new DOMParser().parseFromString(body, "text/html");
          page
            .querySelector(
              'a[href="https://www.metacritic.com/tv/chernobyl/season-1/"]'
            )
            ?.remove();
          body = page.documentElement.outerHTML;
        }
        return { body };
      }
      if (url === seasonUrl) {
        return {
          body: `<link rel="canonical" href="${seasonResponseUrl}"><script type="application/ld+json">{"@context":"https://schema.org","@type":"TVSeason","name":"Chernobyl: Season 1","seasonNumber":${seasonResponseNumber},"partOfSeries":{"@type":"TVSeries","name":"Chernobyl","url":"${seasonParentUrl}"},"aggregateRating":{"@type":"AggregateRating","ratingValue":82,"reviewCount":27}}</script>`,
          finalUrl: seasonResponseUrl,
        };
      }
      return { body: "", status: 404 };
    });
    const data = makeData({
      info: {
        ...makeData().info,
        firstAired: "2019-05-06",
        imdb: "tt7366338",
        selectedSeason: "Season 1",
      },
      isTV: true,
      subjectId: "35286229",
      title: {
        full: "切尔诺贝利 Chernobyl Season 1",
        original: "Chernobyl Season 1",
        primary: "切尔诺贝利",
        seasonLabel: "Season 1",
      },
      year: "2019",
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );

    await vi.waitFor(() =>
      expect(
        root.querySelector(".atv-rating-panel-mc .atv-rating-panel-score")
          ?.textContent
      ).toBe("82")
    );
    expect(requests).toContain(seriesUrl);
    expect(requests).toContain(seasonUrl);

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

    render(null, withoutLink);
    localStorage.clear();
    requests.length = 0;
    hasSeasonLink = true;
    seasonResponseUrl =
      "https://www.metacritic.com/tv/another-series/season-1/";
    seasonParentUrl = "https://www.metacritic.com/tv/another-series/";
    const crossSeries = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );
    await vi.waitFor(() =>
      expect(crossSeries.querySelector(".atv-rating-panel-mc")).toBeNull()
    );

    render(null, crossSeries);
    localStorage.clear();
    requests.length = 0;
    seasonResponseUrl = "https://www.metacritic.com/tv/chernobyl/season-2/";
    seasonResponseNumber = 2;
    seasonParentUrl = seriesUrl;
    const crossSeason = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );
    await vi.waitFor(() =>
      expect(crossSeason.querySelector(".atv-rating-panel-mc")).toBeNull()
    );
    expect(requests).toContain(seasonUrl);
  });
});
