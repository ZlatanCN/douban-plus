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

describe("SubjectPageRuntime Metacritic JSON-LD selection", () => {
  setupSubjectRuntimeHooks();

  it("reads the rating node whose URL matches the mapped work", async () => {
    const subjectId = "70000001";
    const imdbId = "tt01234567";
    const targetUrl = "https://www.metacritic.com/movie/mapped-film/";
    mockNetwork((url) => {
      if (url.includes("wikidata.org/w/api.php")) {
        const requestUrl = new URL(url);
        if (requestUrl.searchParams.get("action") === "query") {
          return {
            body: JSON.stringify({
              query: { search: [{ title: "Q9000001" }] },
            }),
          };
        }
        return {
          body: JSON.stringify({
            entities: {
              Q9000001: {
                claims: {
                  P31: [makeClaim({ id: "Q11424" })],
                  P1712: [makeClaim("movie/mapped-film")],
                  P345: [makeClaim(imdbId)],
                  P4529: [makeClaim(subjectId)],
                },
                id: "Q9000001",
              },
            },
          }),
        };
      }
      if (url === targetUrl) {
        return {
          body: `<link rel="canonical" href="${targetUrl}"><script type="application/ld+json">[{"@type":"Movie","name":"Unrelated Film","url":"https://www.metacritic.com/movie/related-film/","aggregateRating":{"ratingValue":99,"reviewCount":90}},{"@type":"Movie","name":"Mapped Film","url":"${targetUrl}","aggregateRating":{"ratingValue":82,"reviewCount":12}}]</script>`,
        };
      }
      return { body: "", status: 404 };
    });

    const root = renderIntoRoot(
      <SubjectPageRuntime
        data={makeData({
          info: { ...makeData().info, imdb: imdbId },
          subjectId,
          title: {
            full: "Mapped Film",
            original: "Mapped Film",
            primary: "映射影片",
            seasonLabel: "",
          },
        })}
        doc={document}
      />
    );

    await vi.waitFor(() => {
      expect(
        root.querySelector(".atv-rating-panel-mc .atv-rating-panel-score")
          ?.textContent
      ).toBe("82");
    });
    render(null, root);
  });
});
