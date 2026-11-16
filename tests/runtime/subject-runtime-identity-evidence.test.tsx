import { describe, expect, it, vi } from "vitest";

import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import { renderIntoRoot } from "../helpers/render";
import {
  makeClaim,
  makeData,
  makeRtSnapshot,
  mockNetwork,
  setupSubjectRuntimeHooks,
} from "./subject-runtime-test-utils";

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = vi.fn<
    NonNullable<typeof globalThis.GM_xmlhttpRequest>
  >() as never;
});

const animatedMovieEntity = (instanceTypeId = "Q20650540") => ({
  claims: {
    P1258: [makeClaim("m/spirited_away")],
    P1712: [makeClaim("movie/spirited-away")],
    P31: [makeClaim({ id: instanceTypeId })],
    P345: [makeClaim("tt0245429")],
    P4529: [makeClaim("1291561")],
  },
  id: "Q155653",
});

const mockAnimatedMovieNetwork = (instanceTypeId = "Q20650540"): void => {
  mockNetwork((url) => {
    if (url.includes("wikidata.org/w/api.php")) {
      const requestUrl = new URL(url);
      if (requestUrl.searchParams.get("action") === "query") {
        return {
          body: JSON.stringify({
            query: { search: [{ title: "Q155653" }] },
          }),
        };
      }
      const ids = (requestUrl.searchParams.get("ids") ?? "").split("|");
      const entities: Record<string, unknown> = {};
      if (ids.includes("Q155653")) {
        entities.Q155653 = animatedMovieEntity(instanceTypeId);
      }
      if (ids.includes("Q20650540")) {
        entities.Q20650540 = {
          claims: { P279: [makeClaim({ id: "Q202866" })] },
          id: "Q20650540",
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
    if (url === "https://www.rottentomatoes.com/m/spirited_away") {
      return {
        body: '<link rel="canonical" href="https://www.rottentomatoes.com/m/spirited_away"><script type="application/ld+json">{"@type":"Movie","name":"Spirited Away"}</script><script type="application/json" data-json="mediaScorecard">{"criticsScore":{"scorePercent":"97%","ratingCount":225},"audienceScore":{"scorePercent":"96%","bandedRatingCount":"50,000+ Ratings"}}</script>',
      };
    }
    if (url === "https://www.metacritic.com/movie/spirited-away/") {
      return {
        body: '<link rel="canonical" href="https://www.metacritic.com/movie/spirited-away/"><script type="application/ld+json">{"@type":"Movie","name":"Spirited Away","aggregateRating":{"ratingValue":96,"reviewCount":41}}</script>',
      };
    }
    return { body: "", status: 404 };
  });
};

const animatedMovieData = (imdbId = "tt0245429") =>
  makeData({
    info: { ...makeData().info, imdb: imdbId },
    subjectId: "1291561",
    title: {
      full: "千与千寻",
      original: "千と千尋の神隠し",
      primary: "千与千寻",
      seasonLabel: "",
    },
    year: "2001",
  });

const severanceEntity = (rtId = "tv/severance", mcId = "tv/severance") => ({
  claims: {
    P1258: [makeClaim(rtId)],
    P1712: [makeClaim(mcId)],
    P31: [makeClaim({ id: "Q5398426" })],
    P345: [makeClaim("tt11280740")],
    P4529: [makeClaim("34885342")],
  },
  id: "Q101096725",
});

const mockSeveranceNetwork = (
  rtId = "tv/severance",
  mcId = "tv/severance"
): void => {
  mockNetwork((url) => {
    if (url.includes("wikidata.org/w/api.php")) {
      const requestUrl = new URL(url);
      if (requestUrl.searchParams.get("action") === "query") {
        return {
          body: JSON.stringify({
            query: { search: [{ title: "Q101096725" }] },
          }),
        };
      }
      return {
        body: JSON.stringify({
          entities: { Q101096725: severanceEntity(rtId, mcId) },
        }),
      };
    }
    if (url === "https://www.rottentomatoes.com/tv/severance") {
      return {
        body: '<link rel="canonical" href="https://www.rottentomatoes.com/tv/severance"><script type="application/ld+json">{"@type":"TVSeries","name":"Severance"}</script><script type="application/json" data-json="mediaScorecard">{"criticsScore":{"scorePercent":"95%","ratingCount":122},"audienceScore":{"scorePercent":"88%","bandedRatingCount":"5,000+ Ratings"}}</script>',
      };
    }
    if (url === "https://www.metacritic.com/tv/severance/") {
      return {
        body: '<link rel="canonical" href="https://www.metacritic.com/tv/severance/"><script type="application/ld+json">{"@type":"TVSeries","name":"Severance","aggregateRating":{"ratingValue":85,"reviewCount":52}}</script>',
      };
    }
    return { body: "", status: 404 };
  });
};

const severanceData = () =>
  makeData({
    info: {
      ...makeData().info,
      episodes: "9",
      firstAired: "2022-02-18",
      imdb: "tt11280740",
    },
    isTV: true,
    subjectId: "34885342",
    title: {
      full: "人生切割术",
      original: "Severance",
      primary: "人生切割术",
      seasonLabel: "",
    },
    year: "2022",
  });

describe("subject runtime shared Wikidata identity evidence", () => {
  setupSubjectRuntimeHooks();

  it("resolves an animated film whose P31 is anime film through its film ancestry", async () => {
    mockAnimatedMovieNetwork();
    const root = renderIntoRoot(
      <SubjectPageRuntime data={animatedMovieData()} doc={document} />
    );

    await vi.waitFor(() => {
      expect(
        [...root.querySelectorAll(".atv-rt-score-value")].map((node) =>
          node.textContent?.trim()
        )
      ).toStrictEqual(["97%", "96%"]);
      expect(
        root.querySelector(".atv-rating-panel-mc .atv-rating-panel-score")
          ?.textContent
      ).toBe("96");
    });
  });

  it("ablation: an unsupported P31 value does not inherit the animated-film mapping", async () => {
    mockAnimatedMovieNetwork("Q999999");
    const root = renderIntoRoot(
      <SubjectPageRuntime data={animatedMovieData()} doc={document} />
    );

    await vi.waitFor(() => {
      expect(root.querySelector(".atv-rating-panel-rt")).toBeNull();
      expect(root.querySelector(".atv-rating-panel-mc")).toBeNull();
    });
    expect(root.querySelector(".atv-rt-score-value")).toBeNull();
  });

  it("recognizes an s-leading RT slug as a series because it has no season path segment", async () => {
    mockSeveranceNetwork();
    const root = renderIntoRoot(
      <SubjectPageRuntime data={severanceData()} doc={document} />
    );

    await vi.waitFor(() => {
      expect(
        [...root.querySelectorAll(".atv-rt-score-value")].map((node) =>
          node.textContent?.trim()
        )
      ).toStrictEqual(["95%", "88%"]);
      expect(
        root.querySelector(".atv-rating-panel-mc .atv-rating-panel-score")
          ?.textContent
      ).toBe("85");
    });
  });

  it("ablation: an exact season path segment is not accepted as the same series", async () => {
    mockSeveranceNetwork("tv/severance/s01", "tv/severance/season-1");
    const root = renderIntoRoot(
      <SubjectPageRuntime data={severanceData()} doc={document} />
    );

    await vi.waitFor(() => {
      expect(root.querySelector(".atv-rating-panel-rt")).toBeNull();
      expect(root.querySelector(".atv-rating-panel-mc")).toBeNull();
    });
    expect(root.querySelector(".atv-rt-score-value")).toBeNull();
  });

  it("keeps a verified snapshot when Wikidata returns an API error with HTTP 200", async () => {
    const subjectId = "1291561";
    const sourceUrl = "https://www.rottentomatoes.com/m/spirited_away";
    const stale = makeRtSnapshot(
      {
        object: { kind: "movie", rtId: "m/spirited_away", subjectId },
        sourceUrl,
      },
      Date.now() - 10 * 24 * 60 * 60 * 1000
    );
    localStorage.setItem(
      ["dp", "rotten-snapshots", "v1"].join(":"),
      JSON.stringify({
        [JSON.stringify([subjectId, "movie", "m/spirited_away"])]: stale,
      })
    );
    mockNetwork((url) =>
      url.includes("wikidata.org/w/api.php")
        ? { body: JSON.stringify({ error: { code: "ratelimited" } }) }
        : { body: "", status: 404 }
    );
    const root = renderIntoRoot(
      <SubjectPageRuntime data={animatedMovieData("")} doc={document} />
    );

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rt-stale")?.textContent).toBe("旧评分")
    );
    expect(root.querySelector(".atv-rt-score-value")?.textContent).toBe("89%");
  });

  it("ablation: a valid empty search does not preserve a snapshot", async () => {
    const subjectId = "1291561";
    const stale = makeRtSnapshot(
      {
        object: { kind: "movie", rtId: "m/spirited_away", subjectId },
        sourceUrl: "https://www.rottentomatoes.com/m/spirited_away",
      },
      Date.now() - 10 * 24 * 60 * 60 * 1000
    );
    localStorage.setItem(
      ["dp", "rotten-snapshots", "v1"].join(":"),
      JSON.stringify({
        [JSON.stringify([subjectId, "movie", "m/spirited_away"])]: stale,
      })
    );
    mockNetwork((url) =>
      url.includes("wikidata.org/w/api.php")
        ? { body: JSON.stringify({ query: { search: [] } }) }
        : { body: "", status: 404 }
    );
    const root = renderIntoRoot(
      <SubjectPageRuntime data={animatedMovieData("")} doc={document} />
    );

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rating-panel")).toBeNull()
    );
    expect(root.querySelector(".atv-rt-score-value")).toBeNull();
    expect(root.querySelector(".atv-rt-stale")).toBeNull();
  });

  it("keeps a verified snapshot when the entity endpoint returns an HTTP-200 API error", async () => {
    const subjectId = "1291561";
    const stale = makeRtSnapshot(
      {
        object: { kind: "movie", rtId: "m/spirited_away", subjectId },
        sourceUrl: "https://www.rottentomatoes.com/m/spirited_away",
      },
      Date.now() - 10 * 24 * 60 * 60 * 1000
    );
    localStorage.setItem(
      ["dp", "rotten-snapshots", "v1"].join(":"),
      JSON.stringify({
        [JSON.stringify([subjectId, "movie", "m/spirited_away"])]: stale,
      })
    );
    mockNetwork((url) => {
      if (!url.includes("wikidata.org/w/api.php")) {
        return { body: "", status: 404 };
      }
      const requestUrl = new URL(url);
      return requestUrl.searchParams.get("action") === "query"
        ? {
            body: JSON.stringify({
              query: { search: [{ title: "Q155653" }] },
            }),
          }
        : { body: JSON.stringify({ error: { code: "ratelimited" } }) };
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={animatedMovieData("")} doc={document} />
    );

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rt-stale")?.textContent).toBe("旧评分")
    );
    expect(root.querySelector(".atv-rt-score-value")?.textContent).toBe("89%");
  });

  it("ablation: an empty entities result does not preserve a snapshot", async () => {
    const subjectId = "1291561";
    const stale = makeRtSnapshot(
      {
        object: { kind: "movie", rtId: "m/spirited_away", subjectId },
        sourceUrl: "https://www.rottentomatoes.com/m/spirited_away",
      },
      Date.now() - 10 * 24 * 60 * 60 * 1000
    );
    localStorage.setItem(
      ["dp", "rotten-snapshots", "v1"].join(":"),
      JSON.stringify({
        [JSON.stringify([subjectId, "movie", "m/spirited_away"])]: stale,
      })
    );
    mockNetwork((url) => {
      if (!url.includes("wikidata.org/w/api.php")) {
        return { body: "", status: 404 };
      }
      const requestUrl = new URL(url);
      return requestUrl.searchParams.get("action") === "query"
        ? {
            body: JSON.stringify({
              query: { search: [{ title: "Q155653" }] },
            }),
          }
        : { body: JSON.stringify({ entities: {} }) };
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={animatedMovieData("")} doc={document} />
    );

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rating-panel")).toBeNull()
    );
    expect(root.querySelector(".atv-rt-score-value")).toBeNull();
    expect(root.querySelector(".atv-rt-stale")).toBeNull();
  });
});
