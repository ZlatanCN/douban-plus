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
import type { MockReply } from "./subject-runtime-test-utils";

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = vi.fn<
    NonNullable<typeof globalThis.GM_xmlhttpRequest>
  >() as never;
});

describe("subject runtime rt snapshot identity", () => {
  setupSubjectRuntimeHooks();

  it("keeps a confirmed snapshot when the mapped RT page has an invalid structure", async () => {
    const stale = makeRtSnapshot({}, Date.now() - 10 * 24 * 60 * 60 * 1000);
    localStorage.setItem(
      "dp:rotten-snapshots:v2",
      JSON.stringify({
        [JSON.stringify(["1292052", "movie", "m/shawshank_redemption"])]: stale,
      })
    );
    mockNetwork((url) => {
      if (url.includes("wikidata.org/w/api.php")) {
        const requestUrl = new URL(url);
        if (requestUrl.searchParams.get("action") === "query") {
          return {
            body: JSON.stringify({ query: { search: [{ title: "Q172241" }] } }),
          };
        }
        return {
          body: JSON.stringify({
            entities: {
              Q172241: {
                claims: {
                  P1258: [makeClaim("m/shawshank_redemption")],
                  P31: [makeClaim({ id: "Q11424" })],
                  P4529: [makeClaim("1292052")],
                },
              },
            },
          }),
        };
      }
      if (url === "https://www.rottentomatoes.com/m/shawshank_redemption") {
        return {
          body: '<link rel="canonical" href="https://www.rottentomatoes.com/m/shawshank_redemption"><main>temporary page shape</main>',
        };
      }
      return { body: "", status: 404 };
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={makeData()} doc={document} />
    );

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rt-stale")?.textContent).toBe("旧评分")
    );
    expect(root.querySelector(".atv-rt-score-value")?.textContent).toBe("89%");
  });

  it("hides a stale snapshot when the mapped RT page proves a different target", async () => {
    const stale = makeRtSnapshot({}, Date.now() - 10 * 24 * 60 * 60 * 1000);
    localStorage.setItem(
      "dp:rotten-snapshots:v2",
      JSON.stringify({
        [JSON.stringify(["1292052", "movie", "m/shawshank_redemption"])]: stale,
      })
    );
    const rtUrl = "https://www.rottentomatoes.com/m/shawshank_redemption";
    const rtResponse = Promise.withResolvers<MockReply>();
    mockNetwork((url) => {
      if (url.includes("wikidata.org/w/api.php")) {
        const requestUrl = new URL(url);
        if (requestUrl.searchParams.get("action") === "query") {
          return {
            body: JSON.stringify({ query: { search: [{ title: "Q172241" }] } }),
          };
        }
        return {
          body: JSON.stringify({
            entities: {
              Q172241: {
                claims: {
                  P1258: [makeClaim("m/shawshank_redemption")],
                  P31: [makeClaim({ id: "Q11424" })],
                  P4529: [makeClaim("1292052")],
                },
              },
            },
          }),
        };
      }
      return url === rtUrl ? rtResponse.promise : { body: "", status: 404 };
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={makeData()} doc={document} />
    );

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rt-stale")?.textContent).toBe("旧评分")
    );
    rtResponse.resolve({
      body: '<link rel="canonical" href="https://www.rottentomatoes.com/m/different_movie"><script type="application/ld+json">{"@type":"Movie"}</script><script type="application/json" data-json="mediaScorecard">{"criticsScore":{"scorePercent":"90%"}}</script>',
    });

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rating-panel-rt")).toBeNull()
    );
  });

  it("removes a stale snapshot when the matching RT page has no scores", async () => {
    const stale = makeRtSnapshot({}, Date.now() - 10 * 24 * 60 * 60 * 1000);
    const snapshotKey = JSON.stringify([
      "1292052",
      "movie",
      "m/shawshank_redemption",
    ]);
    localStorage.setItem(
      "dp:rotten-snapshots:v2",
      JSON.stringify({ [snapshotKey]: stale })
    );
    mockNetwork((url) => {
      if (url.includes("wikidata.org/w/api.php")) {
        const requestUrl = new URL(url);
        if (requestUrl.searchParams.get("action") === "query") {
          return {
            body: JSON.stringify({ query: { search: [{ title: "Q172241" }] } }),
          };
        }
        return {
          body: JSON.stringify({
            entities: {
              Q172241: {
                claims: {
                  P1258: [makeClaim("m/shawshank_redemption")],
                  P31: [makeClaim({ id: "Q11424" })],
                  P4529: [makeClaim("1292052")],
                },
              },
            },
          }),
        };
      }
      if (url === "https://www.rottentomatoes.com/m/shawshank_redemption") {
        return {
          body: '<link rel="canonical" href="https://www.rottentomatoes.com/m/shawshank_redemption"><script type="application/ld+json">{"@type":"Movie"}</script><script type="application/json" data-json="mediaScorecard">{"criticsScore":null,"audienceScore":null}</script>',
        };
      }
      return { body: "", status: 404 };
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={makeData()} doc={document} />
    );

    await vi.waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem("dp:rotten-snapshots:v2") ?? "{}")
      ).not.toHaveProperty(snapshotKey)
    );
    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rating-panel-rt")).toBeNull()
    );
  });

  it("hides a snapshot older than 30 days", async () => {
    const now = 1_800_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(now);
    const expired = makeRtSnapshot({}, now - 30 * 24 * 60 * 60 * 1000 - 1);
    localStorage.setItem(
      "dp:rotten-snapshots:v2",
      JSON.stringify({
        [JSON.stringify(["1292052", "movie", "m/shawshank_redemption"])]:
          expired,
      })
    );
    mockNetwork(() => ({ body: "upstream unavailable", status: 503 }));
    const root = renderIntoRoot(
      <SubjectPageRuntime data={makeData()} doc={document} />
    );

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rating-panel")).toBeNull()
    );
  });
});
