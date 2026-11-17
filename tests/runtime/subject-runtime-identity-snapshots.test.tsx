import { describe, expect, it, vi } from "vitest";

import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import { renderIntoRoot } from "../helpers/render";
import { animatedMovieData } from "./subject-runtime-identity-evidence-test-support";
import {
  makeRtSnapshot,
  mockNetwork,
  setupSubjectRuntimeHooks,
} from "./subject-runtime-test-utils";

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = vi.fn<
    NonNullable<typeof globalThis.GM_xmlhttpRequest>
  >() as never;
});

describe("subject runtime verified snapshot retention", () => {
  setupSubjectRuntimeHooks();

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
      ["dp", "rotten-snapshots", "v2"].join(":"),
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
      ["dp", "rotten-snapshots", "v2"].join(":"),
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
      ["dp", "rotten-snapshots", "v2"].join(":"),
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
      ["dp", "rotten-snapshots", "v2"].join(":"),
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
