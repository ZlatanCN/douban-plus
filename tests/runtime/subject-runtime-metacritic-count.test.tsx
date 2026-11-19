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

  it("keeps absent and empty counts absent while displaying a real zero", async () => {
    const metacriticUrl =
      "https://www.metacritic.com/movie/spider-man-into-the-spider-verse/";
    let countMode: "empty" | "missing" | "zero" = "missing";
    let instanceTypeId = "Q202866";
    mockNetwork((url) => {
      if (url.includes("wikidata.org/w/api.php")) {
        const requestUrl = new URL(url);
        if (requestUrl.searchParams.get("action") === "query") {
          return {
            body: JSON.stringify({
              query: { search: [{ title: "Q29588607" }] },
            }),
          };
        }
        return {
          body: JSON.stringify({
            entities: {
              Q29588607: {
                claims: {
                  P31: [makeClaim({ id: instanceTypeId })],
                  P1712: [makeClaim("movie/spider-man-into-the-spider-verse")],
                  P345: [makeClaim("tt4633694")],
                  P4529: [makeClaim("26374197")],
                },
                id: "Q29588607",
              },
              Q202866: {
                claims: { P279: [makeClaim({ id: "Q11424" })] },
                id: "Q202866",
              },
            },
          }),
        };
      }
      if (url === metacriticUrl) {
        let reviewCount = "";
        if (countMode === "empty") {
          reviewCount = ',"reviewCount":""';
        } else if (countMode === "zero") {
          reviewCount = ',"reviewCount":0';
        }
        return {
          body: `<link rel="canonical" href="${metacriticUrl}"><script type="application/ld+json">{"@context":"https://schema.org","@type":"Movie","name":"Spider-Man: Into the Spider-Verse","aggregateRating":{"@type":"AggregateRating","ratingValue":0${reviewCount}}}</script>`,
        };
      }
      return { body: "", status: 404 };
    });

    const root = renderIntoRoot(
      <SubjectPageRuntime
        data={makeData({
          info: { ...makeData().info, imdb: "" },
          subjectId: "26374197",
          title: {
            full: "蜘蛛侠：平行宇宙 Spider-Man: Into the Spider-Verse",
            original: "Spider-Man: Into the Spider-Verse",
            primary: "蜘蛛侠：平行宇宙",
            seasonLabel: "",
          },
          year: "2018",
        })}
        doc={document}
      />
    );

    await vi.waitFor(() =>
      expect(
        root.querySelector(".atv-rating-panel-mc .atv-rating-panel-score")
          ?.textContent
      ).toBe("0")
    );
    expect(
      root.querySelector(".atv-rating-panel-mc .atv-rating-panel-count")
    ).toBeNull();

    render(null, root);
    localStorage.clear();
    countMode = "empty";
    const emptyCount = renderIntoRoot(
      <SubjectPageRuntime
        data={makeData({
          info: { ...makeData().info, imdb: "" },
          subjectId: "26374197",
          title: {
            full: "蜘蛛侠：平行宇宙 Spider-Man: Into the Spider-Verse",
            original: "Spider-Man: Into the Spider-Verse",
            primary: "蜘蛛侠：平行宇宙",
            seasonLabel: "",
          },
          year: "2018",
        })}
        doc={document}
      />
    );
    await vi.waitFor(() =>
      expect(
        emptyCount.querySelector(".atv-rating-panel-mc .atv-rating-panel-score")
          ?.textContent
      ).toBe("0")
    );
    expect(
      emptyCount.querySelector(".atv-rating-panel-mc .atv-rating-panel-count")
    ).toBeNull();

    render(null, emptyCount);
    localStorage.clear();
    countMode = "zero";
    const zeroCount = renderIntoRoot(
      <SubjectPageRuntime
        data={makeData({
          info: { ...makeData().info, imdb: "" },
          subjectId: "26374197",
          title: {
            full: "蜘蛛侠：平行宇宙 Spider-Man: Into the Spider-Verse",
            original: "Spider-Man: Into the Spider-Verse",
            primary: "蜘蛛侠：平行宇宙",
            seasonLabel: "",
          },
          year: "2018",
        })}
        doc={document}
      />
    );
    await vi.waitFor(() =>
      expect(
        zeroCount.querySelector(".atv-mc-critics .atv-mc-rating-count")
          ?.textContent
      ).toBe("0")
    );
    render(null, zeroCount);
    localStorage.clear();
    instanceTypeId = "Q999999";
    const unsupportedType = renderIntoRoot(
      <SubjectPageRuntime
        data={makeData({
          info: { ...makeData().info, imdb: "" },
          subjectId: "26374197",
          title: {
            full: "蜘蛛侠：平行宇宙 Spider-Man: Into the Spider-Verse",
            original: "Spider-Man: Into the Spider-Verse",
            primary: "蜘蛛侠：平行宇宙",
            seasonLabel: "",
          },
          year: "2018",
        })}
        doc={document}
      />
    );
    await vi.waitFor(() =>
      expect(unsupportedType.querySelector(".atv-rating-panel-mc")).toBeNull()
    );
  });
});
