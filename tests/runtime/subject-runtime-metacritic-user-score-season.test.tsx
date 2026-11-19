import { render } from "preact";
import { describe, expect, it, vi } from "vitest";

import type { RatingUpdate } from "@/modules/subject/resolve/orchestrate";
import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import chernobyl from "../fixtures/metacritic/chernobyl-season-1-user-score.html?raw";
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

const seriesUrl = "https://www.metacritic.com/tv/chernobyl/";
const seasonUrl = "https://www.metacritic.com/tv/chernobyl/season-1/";
const chernobylData = () =>
  makeData({
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

const mockChernobylNetwork = (page: string, requests: string[]): void => {
  mockNetwork((url) => {
    requests.push(url);
    if (url.includes("wikidata.org/w/api.php")) {
      const requestUrl = new URL(url);
      if (requestUrl.searchParams.get("action") === "query") {
        return {
          body: JSON.stringify({ query: { search: [{ title: "Q48741246" }] } }),
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
      return { body: chernobylSeries };
    }
    if (url === seasonUrl) {
      return { body: page };
    }
    return { body: "", status: 404 };
  });
};

const latestMetaUpdate = (updates: RatingUpdate[]) =>
  updates.findLast((update) => update.source === "mc");

describe("SubjectPageRuntime Metacritic season User score", () => {
  setupSubjectRuntimeHooks();

  it("binds both scores and counts to the current season response", async () => {
    const requests: string[] = [];
    const updates: RatingUpdate[] = [];
    mockChernobylNetwork(chernobyl, requests);
    const root = renderIntoRoot(
      <SubjectPageRuntime
        data={chernobylData()}
        doc={document}
        onRatingUpdate={(update) => updates.push(update)}
      />
    );

    await vi.waitFor(() =>
      expect(
        root.querySelector(".atv-mc-audience .atv-mc-score-value")?.textContent
      ).toBe("9.2")
    );
    expect({
      criticsScore: root.querySelector(".atv-mc-critics .atv-mc-score-value")
        ?.textContent,
      criticsCount: root.querySelector(".atv-mc-critics .atv-mc-rating-count")
        ?.textContent,
      audienceCount: root.querySelector(".atv-mc-audience .atv-mc-rating-count")
        ?.textContent,
      requested: requests.includes(seasonUrl),
      source: root.querySelector<HTMLAnchorElement>(".atv-metacritic-source")
        ?.href,
      rating: latestMetaUpdate(updates)?.result,
    }).toMatchObject({
      criticsScore: "82",
      criticsCount: "27",
      audienceCount: "409",
      requested: true,
      source: seasonUrl,
      rating: {
        diagnostic: { reason: "rating" },
        rating: {
          audience: { displayScore: "9.2", reviewCount: 409, score: 9.2 },
          critics: { displayScore: "82", reviewCount: 27, score: 82 },
          object: { kind: "season", season: 1, subjectId: "35286229" },
        },
      },
    });
    render(null, root);
  });

  it("keeps the verified Metascore but rejects a User score linked to another season", async () => {
    const requests: string[] = [];
    const updates: RatingUpdate[] = [];
    const wrongSeason = chernobyl.replaceAll(
      "season=season-1",
      "season=season-2"
    );
    mockChernobylNetwork(wrongSeason, requests);
    const root = renderIntoRoot(
      <SubjectPageRuntime
        data={chernobylData()}
        doc={document}
        onRatingUpdate={(update) => updates.push(update)}
      />
    );

    await vi.waitFor(() =>
      expect(
        root.querySelector(".atv-mc-critics .atv-mc-score-value")?.textContent
      ).toBe("82")
    );
    expect({
      audience: root.querySelector(".atv-mc-audience"),
      snapshot: localStorage.getItem("dp:metacritic-snapshots:v2"),
      diagnostic: latestMetaUpdate(updates)?.result.diagnostic,
      rating: latestMetaUpdate(updates)?.result.rating,
      requested: requests.includes(seasonUrl),
    }).toMatchObject({
      audience: null,
      snapshot: null,
      diagnostic: {
        errorCode: "user-score-identity",
        reason: "parse-error",
      },
      rating: { audience: null, critics: { reviewCount: 27, score: 82 } },
      requested: true,
    });
    render(null, root);
  });
});
