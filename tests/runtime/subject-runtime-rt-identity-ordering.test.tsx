import { render } from "preact";
import { describe, expect, it, vi } from "vitest";

import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

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

describe("SubjectPageRuntime RT identity completion order", () => {
  setupSubjectRuntimeHooks();

  it("removes a refreshed old rating when the conflicting mapping resolves second", async () => {
    const now = Date.UTC(2026, 10, 16);
    vi.spyOn(Date, "now").mockReturnValue(now);
    const subjectId = "1292052";
    const imdbId = null;
    const oldRtId = "m/shawshank_redemption";
    const newRtId = "m/new_shawshank_target";
    const oldUrl = `https://www.rottentomatoes.com/${oldRtId}`;
    const newUrl = `https://www.rottentomatoes.com/${newRtId}`;
    const snapshotKey = JSON.stringify([subjectId, "movie", oldRtId]);
    const targetKey = JSON.stringify([subjectId, imdbId, "movie", null]);
    const staleSnapshot = makeRtSnapshot(
      {
        object: { kind: "movie", rtId: oldRtId, subjectId },
        sourceUrl: oldUrl,
      },
      now - 10 * 24 * 60 * 60 * 1000
    );
    localStorage.setItem(
      "dp:rotten-snapshots:v2",
      JSON.stringify({ [snapshotKey]: staleSnapshot })
    );
    localStorage.setItem(
      "dp:rotten-targets:v2",
      JSON.stringify([
        [
          targetKey,
          {
            expiresAt: now + 30 * 24 * 60 * 60 * 1000,
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

    const mappingSearchResponse = Promise.withResolvers<MockReply>();
    const oldPageResponse = Promise.withResolvers<MockReply>();
    let oldPageStarted = false;
    let oldPageCompleted = false;
    mockNetwork((url) => {
      if (url === oldUrl) {
        oldPageStarted = true;
        return oldPageResponse.promise.then((reply) => {
          oldPageCompleted = true;
          return reply;
        });
      }
      if (url === newUrl) {
        return { body: "", status: 404 };
      }
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
                id: "Q172241",
              },
            },
          }),
        };
      }
      return { body: "", status: 404 };
    });

    const root = renderIntoRoot(
      <SubjectPageRuntime data={makeData()} doc={document} />
    );
    await vi.waitFor(() => {
      expect(root.querySelector(".atv-rt-stale")?.textContent).toBe("旧评分");
      expect(oldPageStarted).toBeTruthy();
    });

    oldPageResponse.resolve({ body: shawshank, finalUrl: oldUrl });
    await vi.waitFor(() => {
      expect(oldPageCompleted).toBeTruthy();
      expect(root.querySelector(".atv-rt-score-value")?.textContent).toBe(
        "89%"
      );
    });
    const refreshedBeforeConflict = JSON.parse(
      localStorage.getItem("dp:rotten-snapshots:v2") ?? "{}"
    ) as Record<string, { fetchedAt: number }>;
    expect(refreshedBeforeConflict[snapshotKey]?.fetchedAt).toBe(now);

    mappingSearchResponse.resolve({
      body: JSON.stringify({
        query: { search: [{ title: "Q172241" }] },
      }),
    });
    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rating-panel-rt")).toBeNull()
    );
    const snapshotsAfterConflict = JSON.parse(
      localStorage.getItem("dp:rotten-snapshots:v2") ?? "{}"
    ) as Record<string, unknown>;
    expect(snapshotsAfterConflict).not.toHaveProperty(snapshotKey);
    expect(root.querySelector(".atv-rt-score-value")).toBeNull();
    render(null, root);
  });
});
