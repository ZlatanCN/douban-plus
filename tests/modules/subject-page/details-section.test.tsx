import { describe, expect, it } from "vitest";

import {
  DetailsSection,
  collectDetailRows,
} from "../../../src/modules/subject-page/details";
import type { DetailsData, InfoBlock } from "../../../src/types";
import { renderIntoRoot } from "../../helpers";

const emptyInfo: InfoBlock = {
  aliases: "",
  cast: [],
  country: "",
  director: [],
  episodeRuntime: "",
  episodes: "",
  firstAired: "",
  genres: [],
  imdb: "",
  language: "",
  releaseDate: "",
  runtime: "",
  seasons: "",
  writers: [],
};

const makeData = (overrides?: Partial<DetailsData>): DetailsData => ({
  awards: [],
  info: emptyInfo,
  isTV: false,
  ...overrides,
});

const infoWith = (partial: Partial<InfoBlock>): InfoBlock => ({
  ...emptyInfo,
  ...partial,
});

const labels = (root: HTMLElement): string[] =>
  Array.from(root.querySelectorAll(".atv-info-label"), (el) =>
    (el.textContent || "").trim()
  );

const values = (root: HTMLElement): string[] =>
  Array.from(root.querySelectorAll(".atv-info-value"), (el) =>
    (el.textContent || "").trim()
  );

describe(DetailsSection, () => {
  it("renders nothing for empty details", () => {
    const root = renderIntoRoot(<DetailsSection data={makeData()} />);

    expect(root.firstElementChild).toBeNull();
    expect(collectDetailRows(makeData())).toHaveLength(0);
  });

  it("renders linked people, genres and movie time rows", () => {
    const root = renderIntoRoot(
      <DetailsSection
        data={makeData({
          info: infoWith({
            director: [{ href: "https://douban.com/celebrity/1/", text: "A" }],
            genres: ["剧情", "犯罪"],
            releaseDate: "1994-09-23",
            runtime: "142分钟",
          }),
        })}
      />
    );

    expect(root.querySelector("#atv-info")?.tagName).toBe("SECTION");
    expect(labels(root)).toStrictEqual(["导演", "类型", "上映日期", "片长"]);
    expect(values(root)).toStrictEqual([
      "A",
      "剧情 / 犯罪",
      "1994-09-23",
      "142分钟",
    ]);
    expect(root.querySelector("a")?.getAttribute("target")).toBe("_blank");
  });

  it("renders TV time rows and IMDb link", () => {
    const root = renderIntoRoot(
      <DetailsSection
        data={makeData({
          info: infoWith({
            episodeRuntime: "50分钟",
            episodes: "10",
            firstAired: "2024-01-01",
            imdb: "tt1234567",
            seasons: "1",
          }),
          isTV: true,
        })}
      />
    );

    expect(labels(root)).toStrictEqual([
      "首播",
      "季数",
      "集数",
      "单集片长",
      "IMDb",
    ]);
    expect(values(root)).toStrictEqual([
      "2024-01-01",
      "1",
      "10",
      "50分钟",
      "tt1234567",
    ]);
    expect(
      root.querySelector<HTMLAnchorElement>('a[href*="imdb.com"]')?.href
    ).toBe("https://www.imdb.com/title/tt1234567/");
  });
});
