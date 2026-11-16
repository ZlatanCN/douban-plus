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

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = vi.fn<
    NonNullable<typeof globalThis.GM_xmlhttpRequest>
  >() as never;
});

describe("SubjectPageRuntime Metacritic", () => {
  setupSubjectRuntimeHooks();

  it("accepts a Godfather II title alias only when year and director evidence match", async () => {
    const requests: string[] = [];
    const mappedUrl = "https://www.metacritic.com/movie/the-godfather-part-ii/";
    const aliasUrl =
      "https://www.metacritic.com/movie/the-godfather-part-ii-current/";
    let hasDirectorLabels = true;
    let aliasTitle = "The Godfather: Part II";
    let aliasReleaseDate = "1974-12-12";
    mockNetwork((url) => {
      requests.push(url);
      if (url.includes("wikidata.org/w/api.php")) {
        const requestUrl = new URL(url);
        if (requestUrl.searchParams.get("action") === "query") {
          const identifier = requestUrl.searchParams.get("srsearch") ?? "";
          return {
            body: JSON.stringify({
              query: {
                search:
                  identifier.includes("P345=tt0071562") ||
                  identifier.includes("P4529=1299131")
                    ? [{ title: "Q184768" }]
                    : [],
              },
            }),
          };
        }
        if (requestUrl.searchParams.get("props") === "labels|aliases") {
          return {
            body: JSON.stringify({
              entities: {
                Q56094: hasDirectorLabels
                  ? {
                      aliases: {
                        en: [{ value: "Francis Ford Coppola" }],
                        zh: [{ value: "弗朗西斯·福特·科波拉" }],
                      },
                      labels: {
                        en: { value: "Francis Ford Coppola" },
                        zh: { value: "弗朗西斯·福特·科波拉" },
                      },
                    }
                  : { aliases: {}, labels: {} },
              },
            }),
          };
        }
        return {
          body: JSON.stringify({
            entities: {
              Q184768: {
                claims: {
                  P31: [makeClaim({ id: "Q11424" })],
                  P1712: [makeClaim("movie/the-godfather-part-ii")],
                  P345: [makeClaim("tt0071562")],
                  P4529: [makeClaim("1299131")],
                  P57: [makeClaim({ id: "Q56094" })],
                },
                id: "Q184768",
              },
            },
          }),
        };
      }
      if (url === mappedUrl) {
        const body = `<link rel="canonical" href="${aliasUrl}"><script type="application/ld+json">{"@context":"https://schema.org","@type":"Movie","name":"${aliasTitle}","datePublished":"${aliasReleaseDate}","director":{"@type":"Person","name":"Francis Ford Coppola"},"aggregateRating":{"@type":"AggregateRating","ratingValue":90,"reviewCount":18}}</script>`;
        return { body, finalUrl: aliasUrl };
      }
      return { body: "", status: 404 };
    });
    const data = makeData({
      info: {
        ...makeData().info,
        director: [{ href: "", text: "弗朗西斯·福特·科波拉" }],
        imdb: "tt0071562",
        releaseDate: "1974-12-12(美国)",
      },
      subjectId: "1299131",
      title: {
        full: "教父2 The Godfather Part II",
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
      expect(
        root.querySelector(".atv-rating-panel-mc .atv-rating-panel-score")
          ?.textContent
      ).toBe("90")
    );
    expect(requests).toContain(mappedUrl);
    expect(
      root.querySelector<HTMLAnchorElement>(".atv-metacritic-source")?.href
    ).toBe(aliasUrl);

    render(null, root);
    localStorage.clear();
    requests.length = 0;
    hasDirectorLabels = false;
    const withoutDirector = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );
    await vi.waitFor(() =>
      expect(withoutDirector.querySelector(".atv-rating-panel-mc")).toBeNull()
    );
    expect(requests).toContain(mappedUrl);

    render(null, withoutDirector);
    localStorage.clear();
    requests.length = 0;
    hasDirectorLabels = true;
    aliasTitle = "The Godfather Part III";
    aliasReleaseDate = "1990-12-25";
    const crossTitle = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );
    await vi.waitFor(() =>
      expect(crossTitle.querySelector(".atv-rating-panel-mc")).toBeNull()
    );
    expect(requests).toContain(mappedUrl);
  });
});
