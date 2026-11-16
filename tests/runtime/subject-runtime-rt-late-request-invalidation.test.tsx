import { render } from "preact";
import { describe, expect, it, vi } from "vitest";

import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import confirmedEmptyRating from "../fixtures/rotten-tomatoes/confirmed-empty-rating.html?raw";
import shawshank from "../fixtures/rotten-tomatoes/shawshank.html?raw";
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

describe("subject runtime RT late request invalidation", () => {
  setupSubjectRuntimeHooks();

  it("does not restore an old snapshot, target, or score when its request finishes after identity changes", async () => {
    const now = 1_800_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(now);
    const subjectId = "1292052";
    const oldRtId = "m/shawshank_redemption";
    const newRtId = "m/new_shawshank_target";
    const snapshotKey = JSON.stringify([subjectId, "movie", oldRtId]);
    const targetKey = JSON.stringify([subjectId, null, "movie", null]);
    const oldSnapshot = makeRtSnapshot(
      {
        audienceScore: 40,
        criticsScore: 50,
        object: { kind: "movie", rtId: oldRtId, subjectId },
        sourceUrl: `https://www.rottentomatoes.com/${oldRtId}`,
      },
      now - 10 * 24 * 60 * 60 * 1000
    );
    localStorage.setItem(
      "dp:rotten-snapshots:v2",
      JSON.stringify({ [snapshotKey]: oldSnapshot })
    );
    localStorage.setItem(
      "dp:rotten-targets:v2",
      JSON.stringify([
        [
          targetKey,
          {
            expiresAt: now + 24 * 60 * 60 * 1000,
            value: {
              status: "resolved",
              target: {
                identityImdbIds: [],
                identityPersonIds: [],
                rtId: oldRtId,
                seriesRtId: null,
              },
              verifiedAt: now - 25 * 60 * 60 * 1000,
            },
          },
        ],
      ])
    );

    const oldPageResponse = Promise.withResolvers<MockReply>();
    const mappingSearchResponse = Promise.withResolvers<MockReply>();
    let oldPageResponseReturned = false;
    const requestedRtPages: string[] = [];
    mockNetwork((url) => {
      if (url.includes("wikidata.org/w/api.php")) {
        const requestUrl = new URL(url);
        if (requestUrl.searchParams.get("action") === "query") {
          return mappingSearchResponse.promise;
        }
        return {
          body: JSON.stringify({
            entities: {
              Q172241: {
                claims: {
                  P1258: [makeClaim(newRtId)],
                  P31: [makeClaim({ id: "Q11424" })],
                  P4529: [makeClaim(subjectId)],
                },
              },
            },
          }),
        };
      }
      if (url.startsWith("https://www.rottentomatoes.com/")) {
        requestedRtPages.push(url);
        if (url === `https://www.rottentomatoes.com/${oldRtId}`) {
          return oldPageResponse.promise.then((reply) => {
            oldPageResponseReturned = true;
            return reply;
          });
        }
        if (url === `https://www.rottentomatoes.com/${newRtId}`) {
          return { body: confirmedEmptyRating };
        }
      }
      return { body: "", status: 404 };
    });

    const data = makeData();
    const root = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rt-stale")?.textContent).toBe("旧评分")
    );
    mappingSearchResponse.resolve({
      body: JSON.stringify({ query: { search: [{ title: "Q172241" }] } }),
    });
    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rating-panel-rt")).toBeNull()
    );
    expect(
      JSON.parse(localStorage.getItem("dp:rotten-snapshots:v2") ?? "{}")
    ).not.toHaveProperty(snapshotKey);

    oldPageResponse.resolve({
      body: shawshank,
      finalUrl: `https://www.rottentomatoes.com/${oldRtId}`,
    });
    await vi.waitFor(() => expect(oldPageResponseReturned).toBeTruthy());
    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rating-panel-rt")).toBeNull()
    );
    expect(
      JSON.parse(localStorage.getItem("dp:rotten-snapshots:v2") ?? "{}")
    ).not.toHaveProperty(snapshotKey);

    render(null, root);
    const nextRoot = renderIntoRoot(
      <SubjectPageRuntime data={makeData()} doc={document} />
    );
    await vi.waitFor(() =>
      expect(nextRoot.querySelector(".atv-rating-panel-rt")).toBeNull()
    );
    expect(requestedRtPages.at(-1)).toBe(
      `https://www.rottentomatoes.com/${newRtId}`
    );
  });
});
