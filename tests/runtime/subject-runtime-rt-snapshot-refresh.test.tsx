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

describe("subject runtime rt snapshot refresh", () => {
  setupSubjectRuntimeHooks();

  it("keeps a confirmed snapshot for 30 days when refreshing the mapping fails", async () => {
    const now = 1_800_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(now);
    const stale = makeRtSnapshot({}, now - 30 * 24 * 60 * 60 * 1000);
    localStorage.setItem(
      "dp:rotten-snapshots:v2",
      JSON.stringify({
        [JSON.stringify(["1292052", "movie", "m/shawshank_redemption"])]: stale,
      })
    );
    const requests: string[] = [];
    mockNetwork((url) => {
      requests.push(url);
      return { body: "upstream unavailable", status: 503 };
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={makeData()} doc={document} />
    );

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rt-stale")?.textContent).toBe("旧评分")
    );
    expect(root.querySelector(".atv-rt-score-value")?.textContent).toBe("89%");
    expect(requests.every((url) => url.includes("wikidata.org"))).toBeTruthy();
    const snapshots = JSON.parse(
      localStorage.getItem("dp:rotten-snapshots:v2") ?? "{}"
    ) as Record<string, { fetchedAt: number }>;
    expect(
      snapshots[JSON.stringify(["1292052", "movie", "m/shawshank_redemption"])]
        ?.fetchedAt
    ).toBe(now - 30 * 24 * 60 * 60 * 1000);
  });

  it("keeps the default audience score when RT omits overlay metadata", async () => {
    const stale = makeRtSnapshot({}, Date.now() - 10 * 24 * 60 * 60 * 1000);
    localStorage.setItem(
      "dp:rotten-snapshots:v2",
      JSON.stringify({
        [JSON.stringify(["1292052", "movie", "m/shawshank_redemption"])]: stale,
      })
    );
    const rtUrl = "https://www.rottentomatoes.com/m/shawshank_redemption";
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
      if (url === rtUrl) {
        return {
          body: '<link rel="canonical" href="https://www.rottentomatoes.com/m/shawshank_redemption"><script type="application/ld+json">{"@type":"Movie"}</script><script type="application/json" data-json="mediaScorecard">{"criticsScore":null,"audienceScore":{"scorePercent":"76%","bandedRatingCount":"3,000+ Ratings"}}</script>',
        };
      }
      return { body: "", status: 404 };
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={makeData()} doc={document} />
    );

    await vi.waitFor(() =>
      expect(
        [...root.querySelectorAll(".atv-rt-score-value")].map((node) =>
          node.textContent?.trim()
        )
      ).toStrictEqual(["76%"])
    );
    expect(
      root.querySelector(".atv-rt-audience .atv-rt-score-label")?.textContent
    ).toBe("观众");
    expect(root.querySelector(".atv-rt-stale")).toBeNull();
  });

  it("marks a snapshot exactly 7 days old stale and attempts an RT refresh", async () => {
    const now = 1_800_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(now);
    const fresh = makeRtSnapshot({}, now - 7 * 24 * 60 * 60 * 1000);
    localStorage.setItem(
      "dp:rotten-snapshots:v2",
      JSON.stringify({
        [JSON.stringify(["1292052", "movie", "m/shawshank_redemption"])]: fresh,
      })
    );
    const requests: string[] = [];
    mockNetwork((url) => {
      requests.push(url);
      if (!url.includes("wikidata.org/w/api.php")) {
        return { body: "", status: 404 };
      }
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
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={makeData()} doc={document} />
    );

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rt-stale")?.textContent).toBe("旧评分")
    );
    expect(root.querySelector(".atv-rt-score-value")?.textContent).toBe("89%");
    expect(
      requests.some((url) =>
        url.startsWith("https://www.rottentomatoes.com/m/")
      )
    ).toBeTruthy();
  });
});
