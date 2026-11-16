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

describe("SubjectPageRuntime rating lifecycle", () => {
  setupSubjectRuntimeHooks();

  it("does not show a future-dated RT snapshot after mapping lookup times out", async () => {
    const now = Date.UTC(2026, 10, 16);
    vi.spyOn(Date, "now").mockReturnValue(now);
    const futureSnapshot = {
      audienceCount: { kind: "range", lowerBound: 250_000 },
      audienceGroup: "all",
      audienceScore: 98,
      criticsCount: { kind: "exact", value: 147 },
      criticsScore: 89,
      fetchedAt: now + 1,
      object: {
        kind: "movie",
        rtId: "m/shawshank_redemption",
        subjectId: "1292052",
      },
      sourceUrl: "https://www.rottentomatoes.com/m/shawshank_redemption",
      stale: false,
    };
    localStorage.setItem(
      "dp:rotten-snapshots:v2",
      JSON.stringify({
        [JSON.stringify(["1292052", "movie", "m/shawshank_redemption"])]:
          futureSnapshot,
      })
    );
    mockNetwork((url) =>
      url.includes("wikidata.org/w/api.php")
        ? "timeout"
        : { body: "", status: 404 }
    );

    const root = renderIntoRoot(
      <SubjectPageRuntime data={makeData()} doc={document} />
    );

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rating-panel-rt")).toBeNull()
    );
    expect(root.querySelector(".atv-rt-score-value")).toBeNull();
    render(null, root);
  });

  it("does not render or persist the old subject after its pending request is unmounted", async () => {
    const oldSubjectId = "1292052";
    const newSubjectId = "99999999";
    const oldSearchResponse = Promise.withResolvers<MockReply>();
    const newRtUrl = "https://www.rottentomatoes.com/m/new_subject";
    const oldRtUrl = "https://www.rottentomatoes.com/m/shawshank_redemption";
    let oldSearchStarted = false;
    const requests: string[] = [];
    mockNetwork((url) => {
      requests.push(url);
      if (url.includes("wikidata.org/w/api.php")) {
        const requestUrl = new URL(url);
        if (requestUrl.searchParams.get("action") === "query") {
          const search = requestUrl.searchParams.get("srsearch") ?? "";
          if (search.includes(`P4529=${oldSubjectId}`)) {
            oldSearchStarted = true;
            return oldSearchResponse.promise;
          }
          if (search.includes(`P4529=${newSubjectId}`)) {
            return {
              body: JSON.stringify({
                query: { search: [{ title: "Q999" }] },
              }),
            };
          }
        }
        return {
          body: JSON.stringify({
            entities: {
              Q999: {
                claims: {
                  P1258: [makeClaim("m/new_subject")],
                  P31: [makeClaim({ id: "Q11424" })],
                  P4529: [makeClaim(newSubjectId)],
                },
                id: "Q999",
              },
            },
          }),
        };
      }
      if (url === newRtUrl) {
        return {
          body: `<link rel="canonical" href="${newRtUrl}"><script type="application/ld+json">{"@type":"Movie","name":"New Subject"}</script><script type="application/json" data-json="mediaScorecard">{"criticsScore":{"scorePercent":"91%","ratingCount":12},"audienceScore":{"scorePercent":"84%","bandedRatingCount":"100+ Ratings"}}</script>`,
        };
      }
      return url === oldRtUrl
        ? { body: "", status: 404 }
        : { body: "", status: 404 };
    });

    const oldRoot = renderIntoRoot(
      <SubjectPageRuntime data={makeData()} doc={document} />
    );
    await vi.waitFor(() => expect(oldSearchStarted).toBeTruthy());
    render(null, oldRoot);

    oldSearchResponse.resolve({
      body: JSON.stringify({
        query: { search: [{ title: "Q172241" }] },
      }),
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(oldRoot.querySelector(".atv-rating-panel-rt")).toBeNull();
    expect(localStorage.getItem("dp:rotten-snapshots:v2")).toBeNull();

    const newData = makeData({
      subjectId: newSubjectId,
      title: {
        full: "New Subject",
        original: "New Subject",
        primary: "新作品",
        seasonLabel: "",
      },
    });
    const newRoot = renderIntoRoot(
      <SubjectPageRuntime data={newData} doc={document} />
    );
    await vi.waitFor(() => {
      expect(
        [...newRoot.querySelectorAll(".atv-rt-score-value")].map((node) =>
          node.textContent?.trim()
        )
      ).toStrictEqual(["91%", "84%"]);
    });
    expect(requests).toContain(newRtUrl);
    expect(
      newRoot.querySelector<HTMLAnchorElement>(".atv-rt-source")?.href
    ).toBe(newRtUrl);
    render(null, newRoot);
  });
});
