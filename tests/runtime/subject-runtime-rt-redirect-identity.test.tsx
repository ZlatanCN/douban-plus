import { describe, expect, it, vi } from "vitest";

import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import godfatherPartII from "../fixtures/rotten-tomatoes/godfather-part-ii.html?raw";
import godfather from "../fixtures/rotten-tomatoes/godfather.html?raw";
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

const godfatherPartIIData = () =>
  makeData({
    info: {
      ...makeData().info,
      director: [{ text: "弗朗西斯·福特·科波拉", href: "" }],
      imdb: "tt0071562",
      releaseDate: "1974",
    },
    subjectId: "1299131",
    title: {
      full: "教父2",
      original: "The Godfather: Part II",
      primary: "教父2",
      seasonLabel: "",
    },
    year: "1974",
  });

const mockGodfatherAlias = (
  finalPage: string,
  finalUrl: string,
  includeDirectorIdentity = true
): string[] => {
  const requests: string[] = [];
  mockNetwork((url) => {
    requests.push(url);
    if (url.includes("wikidata.org/w/api.php")) {
      const requestUrl = new URL(url);
      if (requestUrl.searchParams.get("action") === "query") {
        return {
          body: JSON.stringify({ query: { search: [{ title: "Q184768" }] } }),
        };
      }
      if (requestUrl.searchParams.get("props") === "labels|aliases") {
        return {
          body: JSON.stringify({
            entities: {
              Q56094: {
                labels: {
                  en: { language: "en", value: "Francis Ford Coppola" },
                  "zh-cn": {
                    language: "zh-cn",
                    value: "弗朗西斯·福特·科波拉",
                  },
                },
                aliases: {
                  en: [{ language: "en", value: "Francis Coppola" }],
                  zh: [
                    { language: "zh", value: "科波拉" },
                    { language: "zh", value: "弗朗西斯·福特·科波拉" },
                  ],
                },
              },
            },
          }),
        };
      }
      return {
        body: JSON.stringify({
          entities: {
            Q184768: {
              claims: {
                P1258: [
                  {
                    mainsnak: {
                      datavalue: { value: "m/godfather_part_ii" },
                      snaktype: "value",
                    },
                    rank: "normal",
                  },
                ],
                P31: [
                  {
                    mainsnak: {
                      datavalue: { value: { id: "Q11424" } },
                      snaktype: "value",
                    },
                    rank: "normal",
                  },
                ],
                P345: [
                  {
                    mainsnak: {
                      datavalue: { value: "tt0071562" },
                      snaktype: "value",
                    },
                    rank: "normal",
                  },
                ],
                ...(includeDirectorIdentity
                  ? { P57: [makeClaim({ id: "Q56094" })] }
                  : {}),
                P4529: [
                  {
                    mainsnak: {
                      datavalue: { value: "1299131" },
                      snaktype: "value",
                    },
                    rank: "normal",
                  },
                ],
              },
              id: "Q184768",
            },
          },
        }),
      };
    }
    if (url === "https://www.rottentomatoes.com/m/godfather_part_ii") {
      return { body: finalPage, finalUrl };
    }
    return { body: "", status: 404 };
  });
  return requests;
};

describe("subject runtime RT redirect identity", () => {
  setupSubjectRuntimeHooks();

  it("accepts the Godfather II alias using its original title, theatrical year, and director", async () => {
    const requests = mockGodfatherAlias(
      godfatherPartII,
      "https://www.rottentomatoes.com/m/the_godfather_part_ii"
    );
    const root = renderIntoRoot(
      <SubjectPageRuntime data={godfatherPartIIData()} doc={document} />
    );

    await vi.waitFor(() => {
      expect(
        requests.some((url) => {
          const requestUrl = new URL(url);
          return (
            requestUrl.searchParams.get("props") === "labels|aliases" &&
            requestUrl.searchParams.get("ids") === "Q56094"
          );
        })
      ).toBeTruthy();
    });
    await vi.waitFor(() => {
      expect(
        [...root.querySelectorAll(".atv-rt-score-value")].map((node) =>
          node.textContent?.trim()
        )
      ).toStrictEqual(["96%", "97%"]);
    });
    expect(root.querySelector<HTMLAnchorElement>(".atv-rt-source")?.href).toBe(
      "https://www.rottentomatoes.com/m/the_godfather_part_ii"
    );
  });

  it("rejects a redirect to The Godfather even when its canonical page is self-consistent", async () => {
    mockGodfatherAlias(
      godfather,
      "https://www.rottentomatoes.com/m/the_godfather"
    );
    const root = renderIntoRoot(
      <SubjectPageRuntime data={godfatherPartIIData()} doc={document} />
    );

    await vi.waitFor(() => {
      expect(root.querySelector(".atv-rating-panel-rt")).toBeNull();
    });
    expect(root.querySelector(".atv-rt-score-value")).toBeNull();
  });

  it("rejects an alias when its Wikidata work has no director identity evidence", async () => {
    mockGodfatherAlias(
      godfatherPartII,
      "https://www.rottentomatoes.com/m/the_godfather_part_ii",
      false
    );
    const root = renderIntoRoot(
      <SubjectPageRuntime data={godfatherPartIIData()} doc={document} />
    );

    await vi.waitFor(() => {
      expect(root.querySelector(".atv-rating-panel-rt")).toBeNull();
    });
    expect(root.querySelector(".atv-rt-score-value")).toBeNull();
  });

  it("rejects an alias with a conflicting stable IMDb identity despite matching work details", async () => {
    const pageWithConflictingIdentity = godfatherPartII.replace(
      '"dateCreated": "2012-04-19"',
      '"dateCreated": "2012-04-19", "sameAs": "https://www.imdb.com/title/tt9999999"'
    );
    mockGodfatherAlias(
      pageWithConflictingIdentity,
      "https://www.rottentomatoes.com/m/the_godfather_part_ii"
    );
    const root = renderIntoRoot(
      <SubjectPageRuntime data={godfatherPartIIData()} doc={document} />
    );

    await vi.waitFor(() => {
      expect(root.querySelector(".atv-rating-panel-rt")).toBeNull();
    });
    expect(root.querySelector(".atv-rt-score-value")).toBeNull();
  });
});
