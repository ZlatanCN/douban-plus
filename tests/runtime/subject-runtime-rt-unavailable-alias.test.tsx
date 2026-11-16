import { describe, expect, it, vi } from "vitest";

import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import godfatherPartII from "../fixtures/rotten-tomatoes/godfather-part-ii.html?raw";
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

describe("subject runtime RT alias verification failure", () => {
  setupSubjectRuntimeHooks();

  it("keeps a verified stale snapshot while Wikidata director names are unavailable", async () => {
    const now = 1_800_000_000_000;
    const subjectId = "1299131";
    const rtId = "m/godfather_part_ii";
    const snapshotKey = JSON.stringify([subjectId, "movie", rtId]);
    vi.spyOn(Date, "now").mockReturnValue(now);
    localStorage.setItem(
      "dp:rotten-snapshots:v2",
      JSON.stringify({
        [snapshotKey]: makeRtSnapshot(
          {
            audienceScore: 40,
            criticsScore: 50,
            object: { kind: "movie", rtId, subjectId },
            sourceUrl: "https://www.rottentomatoes.com/m/the_godfather_part_ii",
          },
          now - 10 * 24 * 60 * 60 * 1000
        ),
      })
    );
    localStorage.setItem(
      "dp:rotten-targets:v2",
      JSON.stringify([
        [
          JSON.stringify([subjectId, "tt0071562", "movie", null]),
          {
            expiresAt: now + 24 * 60 * 60 * 1000,
            value: {
              status: "resolved",
              target: {
                identityImdbIds: ["tt0071562"],
                identityPersonIds: ["Q56094"],
                rtId,
                seriesRtId: null,
              },
              verifiedAt: now - 25 * 60 * 60 * 1000,
            },
          },
        ],
      ])
    );
    mockNetwork((url) => {
      if (url.includes("wikidata.org/w/api.php")) {
        const requestUrl = new URL(url);
        if (requestUrl.searchParams.get("action") === "query") {
          return {
            body: JSON.stringify({
              query: { search: [{ title: "Q184768" }] },
            }),
          };
        }
        if (requestUrl.searchParams.get("props") === "labels|aliases") {
          return {
            body: JSON.stringify({ error: { code: "ratelimited" } }),
          };
        }
        return {
          body: JSON.stringify({
            entities: {
              Q184768: {
                claims: {
                  P1258: [makeClaim(rtId)],
                  P31: [makeClaim({ id: "Q11424" })],
                  P345: [makeClaim("tt0071562")],
                  P57: [makeClaim({ id: "Q56094" })],
                  P4529: [makeClaim(subjectId)],
                },
                id: "Q184768",
              },
            },
          }),
        };
      }
      if (url === `https://www.rottentomatoes.com/${rtId}`) {
        return {
          body: godfatherPartII,
          finalUrl: "https://www.rottentomatoes.com/m/the_godfather_part_ii",
        };
      }
      return { body: "", status: 404 };
    });
    const data = makeData({
      info: {
        ...makeData().info,
        director: [{ text: "弗朗西斯·福特·科波拉", href: "" }],
        imdb: "tt0071562",
        releaseDate: "1974",
      },
      subjectId,
      title: {
        full: "教父2",
        original: "The Godfather: Part II",
        primary: "教父2",
        seasonLabel: "",
      },
      year: "1974",
    });
    const root = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-rt-stale")?.textContent).toBe("旧评分")
    );
    expect(
      [...root.querySelectorAll(".atv-rt-score-value")].map((node) =>
        node.textContent?.trim()
      )
    ).toStrictEqual(["50%", "40%"]);
    expect(
      JSON.parse(localStorage.getItem("dp:rotten-snapshots:v2") ?? "{}")
    ).toHaveProperty(snapshotKey);
  });
});
