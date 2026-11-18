import { describe, expect, it, vi } from "vitest";

import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import severanceSeries from "../fixtures/rotten-tomatoes/severance-series.html?raw";
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

describe("subject runtime RT series source pages", () => {
  setupSubjectRuntimeHooks();

  it("treats the s-leading Severance path as a series page and renders its score groups", async () => {
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
            entities: {
              Q101096725: {
                claims: {
                  P1258: [makeClaim("tv/severance")],
                  P31: [makeClaim({ id: "Q5398426" })],
                  P345: [makeClaim("tt11280740")],
                  P4529: [makeClaim("34885342")],
                },
                id: "Q101096725",
              },
            },
          }),
        };
      }
      if (url === "https://www.rottentomatoes.com/tv/severance") {
        return { body: severanceSeries };
      }
      return { body: "", status: 404 };
    });
    const data = makeData({
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
    const root = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );

    await vi.waitFor(() => {
      expect(
        [...root.querySelectorAll(".atv-rt-score-value")].map((node) =>
          node.textContent?.trim()
        )
      ).toStrictEqual(["95%", "80%"]);
    });
    expect(root.querySelector<HTMLAnchorElement>(".atv-rt-source")?.href).toBe(
      "https://www.rottentomatoes.com/tv/severance"
    );
  });
});
