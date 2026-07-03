/* ── buildDetails — Unit Tests ────────────────────────────── */
/* Tests the details section builder for movie/TV info, IMDB,  */
/* awards, and null return for empty data.                      */

import { describe, it, expect } from "vitest";

import { buildDetails } from "../../src/build";
import type { DetailsData, InfoBlock } from "../../src/types";

/* ── Helpers ───────────────────────────────────────────────── */

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

/** Shorthand: extract all `.atv-info-label` cells from the grid */
const labels = (section: HTMLElement): NodeListOf<Element> =>
  section.querySelectorAll(".atv-info-grid > .atv-info-label");

/** Shorthand: extract all `.atv-info-value` cells from the grid */
const values = (section: HTMLElement): NodeListOf<Element> =>
  section.querySelectorAll(".atv-info-grid > .atv-info-value");

/** Assert that the row at `index` has the given label text */
const expectLabel = (
  section: HTMLElement,
  index: number,
  text: string
): void => {
  expect(labels(section)[index]?.textContent).toBe(text);
};

/* ── Tests ─────────────────────────────────────────────────── */

describe("buildDetails", () => {
  /* ── Null return ──────────────────────────────────────── */

  it("returns null for empty info with no awards (t1)", () => {
    expect(buildDetails(makeData())).toBeNull();
  });

  it("returns null when info has only empty arrays and awards is empty", () => {
    const data = makeData({
      info: infoWith({
        cast: [],
        director: [],
        writers: [],
      }),
    });
    expect(buildDetails(data)).toBeNull();
  });

  /* ── Director ─────────────────────────────────────────── */

  it("renders director row when info.director has entries (t2)", () => {
    const section = buildDetails(
      makeData({
        info: infoWith({
          director: [{ href: "", text: "Frank Darabont" }],
        }),
      })
    ) as HTMLElement;

    expect(section.tagName).toBe("SECTION");
    expectLabel(section, 0, "导演");
    expect(values(section)[0]?.textContent).toBe("Frank Darabont");
  });

  it("director entries with href render as anchor tags (t3)", () => {
    const section = buildDetails(
      makeData({
        info: infoWith({
          director: [
            {
              href: "https://douban.com/celebrity/1/",
              text: "Christopher Nolan",
            },
            { href: "", text: "No Link Director" },
          ],
        }),
      })
    ) as HTMLElement;

    const value = values(section)[0] as HTMLElement;
    const anchors = value.querySelectorAll("a");
    expect(anchors).toHaveLength(1);
    expect(anchors[0]?.textContent).toBe("Christopher Nolan");
    expect(anchors[0]?.getAttribute("href")).toBe(
      "https://douban.com/celebrity/1/"
    );
    expect(anchors[0]?.getAttribute("rel")).toBe("noopener");
    expect(anchors[0]?.getAttribute("target")).toBe("_blank");
    // entry without href renders as plain span
    expect(value.textContent).toContain("No Link Director");
  });

  it("multiple directors are joined with separator", () => {
    const section = buildDetails(
      makeData({
        info: infoWith({
          director: [
            { href: "", text: "A" },
            { href: "", text: "B" },
            { href: "", text: "C" },
          ],
        }),
      })
    ) as HTMLElement;

    const value = values(section)[0] as HTMLElement;
    expect(value.textContent).toBe("A / B / C");
    // 3 text spans + 2 separator spans = 5 direct children
    const sepSpans = value.querySelectorAll(":scope > span");
    expect(sepSpans).toHaveLength(5);
  });

  /* ── Writers ──────────────────────────────────────────── */

  it("renders writers row when info.writers has entries (t4)", () => {
    const section = buildDetails(
      makeData({
        info: infoWith({
          writers: [{ href: "", text: "Stephen King" }],
        }),
      })
    ) as HTMLElement;

    expectLabel(section, 0, "编剧");
    expect(values(section)[0]?.textContent).toBe("Stephen King");
  });

  /* ── Cast ─────────────────────────────────────────────── */

  it("renders cast row when info.cast has entries (t5)", () => {
    const section = buildDetails(
      makeData({
        info: infoWith({
          cast: [
            { href: "", text: "Tim Robbins" },
            { href: "", text: "Morgan Freeman" },
          ],
        }),
      })
    ) as HTMLElement;

    expectLabel(section, 0, "主演");
    expect(values(section)[0]?.textContent).toBe(
      "Tim Robbins / Morgan Freeman"
    );
  });

  /* ── Genres ───────────────────────────────────────────── */

  it("genres row joins array with ' / ' separator (t6)", () => {
    const section = buildDetails(
      makeData({
        info: infoWith({
          genres: ["剧情", "犯罪"],
        }),
      })
    ) as HTMLElement;

    expectLabel(section, 0, "类型");
    expect(values(section)[0]?.textContent).toBe("剧情 / 犯罪");
  });

  it("single genre renders without separator", () => {
    const section = buildDetails(
      makeData({
        info: infoWith({
          genres: ["喜剧"],
        }),
      })
    ) as HTMLElement;

    expectLabel(section, 0, "类型");
    expect(values(section)[0]?.textContent).toBe("喜剧");
  });

  /* ── Country ──────────────────────────────────────────── */

  it("renders country row (t7)", () => {
    const section = buildDetails(
      makeData({
        info: infoWith({ country: "美国" }),
      })
    ) as HTMLElement;

    expectLabel(section, 0, "制片国家/地区");
    expect(values(section)[0]?.textContent).toBe("美国");
  });

  /* ── Language ─────────────────────────────────────────── */

  it("renders language row (t8)", () => {
    const section = buildDetails(
      makeData({
        info: infoWith({ language: "英语" }),
      })
    ) as HTMLElement;

    expectLabel(section, 0, "语言");
    expect(values(section)[0]?.textContent).toBe("英语");
  });

  /* ── Movie time rows ──────────────────────────────────── */

  it("renders release date and runtime for movie (isTV=false) (t9)", () => {
    const section = buildDetails(
      makeData({
        info: infoWith({
          releaseDate: "1994-09-23",
          runtime: "142分钟",
        }),
        isTV: false,
      })
    ) as HTMLElement;

    expectLabel(section, 0, "上映日期");
    expect(values(section)[0]?.textContent).toBe("1994-09-23");
    expectLabel(section, 1, "片长");
    expect(values(section)[1]?.textContent).toBe("142分钟");
  });

  it("movie without runtime only shows release date", () => {
    const section = buildDetails(
      makeData({
        info: infoWith({
          releaseDate: "1994-09-23",
          runtime: "",
        }),
        isTV: false,
      })
    ) as HTMLElement;

    expectLabel(section, 0, "上映日期");
    expect(values(section)[0]?.textContent).toBe("1994-09-23");
    expect(labels(section)).toHaveLength(1);
  });

  it("movie without release date only shows runtime", () => {
    const section = buildDetails(
      makeData({
        info: infoWith({
          releaseDate: "",
          runtime: "142分钟",
        }),
        isTV: false,
      })
    ) as HTMLElement;

    expectLabel(section, 0, "片长");
    expect(values(section)[0]?.textContent).toBe("142分钟");
  });

  /* ── TV time rows ─────────────────────────────────────── */

  it("renders first aired, seasons, episodes, episode runtime for TV (isTV=true) (t10)", () => {
    const section = buildDetails(
      makeData({
        info: infoWith({
          episodeRuntime: "55分钟",
          episodes: "73",
          firstAired: "2011-04-17",
          seasons: "8",
        }),
        isTV: true,
      })
    ) as HTMLElement;

    expectLabel(section, 0, "首播");
    expect(values(section)[0]?.textContent).toBe("2011-04-17");
    expectLabel(section, 1, "季数");
    expect(values(section)[1]?.textContent).toBe("8");
    expectLabel(section, 2, "集数");
    expect(values(section)[2]?.textContent).toBe("73");
    expectLabel(section, 3, "单集片长");
    expect(values(section)[3]?.textContent).toBe("55分钟");
  });

  it("TV uses releaseDate when firstAired is empty", () => {
    const section = buildDetails(
      makeData({
        info: infoWith({
          firstAired: "",
          releaseDate: "2023-01-15",
          seasons: "1",
        }),
        isTV: true,
      })
    ) as HTMLElement;

    expectLabel(section, 0, "首播");
    expect(values(section)[0]?.textContent).toBe("2023-01-15");
    expect(labels(section)).toHaveLength(2);
  });

  it("TV without any date fields skips 首播 row", () => {
    const section = buildDetails(
      makeData({
        info: infoWith({
          episodes: "24",
          firstAired: "",
          releaseDate: "",
          seasons: "3",
        }),
        isTV: true,
      })
    ) as HTMLElement;

    expectLabel(section, 0, "季数");
    expect(values(section)[0]?.textContent).toBe("3");
    expectLabel(section, 1, "集数");
    expect(values(section)[1]?.textContent).toBe("24");
  });

  /* ── Aliases ──────────────────────────────────────────── */

  it("renders aliases row when present (t16)", () => {
    const section = buildDetails(
      makeData({
        info: infoWith({
          aliases: "肖申克的救赎 / 月黑高飞(港) / 刺激1995(台)",
        }),
      })
    ) as HTMLElement;

    expectLabel(section, 0, "又名");
    expect(values(section)[0]?.textContent).toBe(
      "肖申克的救赎 / 月黑高飞(港) / 刺激1995(台)"
    );
  });

  it("skips aliases row when empty", () => {
    expect(
      buildDetails(
        makeData({
          info: infoWith({ aliases: "" }),
        })
      )
    ).toBeNull();
  });

  /* ── IMDB ─────────────────────────────────────────────── */

  it("valid IMDB id (tt1234567) renders as anchor with link and arrow icon (t11)", () => {
    const section = buildDetails(
      makeData({
        info: infoWith({ imdb: "tt0111161" }),
      })
    ) as HTMLElement;

    expectLabel(section, 0, "IMDb");
    const value = values(section)[0] as HTMLElement;
    const anchor = value.querySelector("a");
    expect(anchor).not.toBeNull();
    expect(anchor?.getAttribute("href")).toBe(
      "https://www.imdb.com/title/tt0111161/"
    );
    expect(anchor?.getAttribute("rel")).toBe("noopener");
    expect(anchor?.getAttribute("target")).toBe("_blank");
    expect(anchor?.textContent).toContain("tt0111161");
    // arrow icon is rendered as a child span with SVG
    expect(anchor?.querySelector("span")).not.toBeNull();
  });

  it("non-IMDB text renders as plain text without link (t12)", () => {
    const section = buildDetails(
      makeData({
        info: infoWith({ imdb: "N/A" }),
      })
    ) as HTMLElement;

    expectLabel(section, 0, "IMDb");
    const value = values(section)[0] as HTMLElement;
    expect(value.querySelector("a")).toBeNull();
    expect(value.textContent).toBe("N/A");
  });

  it("IMDB with non-matching format renders as plain text", () => {
    const section = buildDetails(
      makeData({
        info: infoWith({ imdb: "not-an-imdb-id" }),
      })
    ) as HTMLElement;

    const value = values(section)[0] as HTMLElement;
    expect(value.querySelector("a")).toBeNull();
    expect(value.textContent).toBe("not-an-imdb-id");
  });

  /* ── Awards ───────────────────────────────────────────── */

  it("renders awards row with org and name and person (t13)", () => {
    const section = buildDetails(
      makeData({
        awards: [
          {
            name: "Best Picture",
            org: "Oscar",
            orgLink: "",
            person: "",
            personLink: "",
          },
        ],
        info: infoWith({ imdb: "tt0111161" }),
      })
    ) as HTMLElement;

    const awardLabels = labels(section);
    const awardValues = values(section);
    // IMDb + award
    expect(awardLabels).toHaveLength(2);
    expect(awardValues).toHaveLength(2);
    expect(awardLabels[1]?.textContent).toBe("Oscar");
    expect(awardValues[1]?.textContent).toContain("Best Picture");
  });

  it("award with orgLink renders org as anchor (t14)", () => {
    const section = buildDetails(
      makeData({
        awards: [
          {
            name: "Best Picture",
            org: "Oscars",
            orgLink: "https://oscars.org/",
            person: "",
            personLink: "",
          },
        ],
        info: infoWith({ imdb: "tt0111161" }),
      })
    ) as HTMLElement;

    const awardLabel = labels(section)[1] as HTMLElement;
    const anchor = awardLabel.querySelector("a");
    expect(anchor).not.toBeNull();
    expect(anchor?.textContent).toBe("Oscars");
    expect(anchor?.getAttribute("href")).toBe("https://oscars.org/");
  });

  it("award with personLink renders person as anchor (t15)", () => {
    const section = buildDetails(
      makeData({
        awards: [
          {
            name: "Best Director",
            org: "Golden Globe",
            orgLink: "",
            person: "Christopher Nolan",
            personLink: "https://douban.com/celebrity/1/",
          },
        ],
        info: infoWith({ imdb: "tt0111161" }),
      })
    ) as HTMLElement;

    const awardValue = values(section)[1] as HTMLElement;
    const anchor = awardValue.querySelector("a");
    expect(anchor).not.toBeNull();
    expect(anchor?.textContent).toBe("Christopher Nolan");
    expect(anchor?.getAttribute("href")).toBe(
      "https://douban.com/celebrity/1/"
    );
  });

  it("award with person but no personLink renders plain text", () => {
    const section = buildDetails(
      makeData({
        awards: [
          {
            name: "Best Actor",
            org: "Oscar",
            orgLink: "",
            person: "Tim Robbins",
            personLink: "",
          },
        ],
        info: infoWith({ imdb: "tt0111161" }),
      })
    ) as HTMLElement;

    const awardValue = values(section)[1] as HTMLElement;
    expect(awardValue.querySelector("a")).toBeNull();
    expect(awardValue.textContent).toContain("Tim Robbins");
  });

  it("multiple awards render correctly (t17)", () => {
    const section = buildDetails(
      makeData({
        awards: [
          {
            name: "Best Picture",
            org: "Oscar",
            orgLink: "",
            person: "",
            personLink: "",
          },
          {
            name: "Best Drama",
            org: "Golden Globe",
            orgLink: "https://goldenglobes.com/",
            person: "Frank Darabont",
            personLink: "",
          },
        ],
        info: infoWith({ imdb: "tt0111161" }),
      })
    ) as HTMLElement;

    const awardLabels = labels(section);
    const awardValues = values(section);
    // IMDb + 2 awards
    expect(awardLabels).toHaveLength(3);
    expect(awardValues).toHaveLength(3);
    expect(awardLabels[1]?.textContent).toBe("Oscar");
    expect(awardValues[1]?.textContent).toContain("Best Picture");

    const secondLabel = awardLabels[2] as HTMLElement;
    expect(secondLabel.textContent).toBe("Golden Globe");
    expect(secondLabel.querySelector("a")?.getAttribute("href")).toBe(
      "https://goldenglobes.com/"
    );
    expect(awardValues[2]?.textContent).toContain("Best Drama");
    expect(awardValues[2]?.textContent).toContain("Frank Darabont");
  });

  it("awards with empty org and name still produces a row", () => {
    const section = buildDetails(
      makeData({
        awards: [
          {
            name: "",
            org: "Some Award",
            orgLink: "",
            person: "",
            personLink: "",
          },
        ],
        info: infoWith({ imdb: "tt0111161" }),
      })
    ) as HTMLElement;

    const awardLabels = labels(section);
    // IMDb + award
    expect(awardLabels).toHaveLength(2);
    expect(awardLabels[1]?.textContent).toBe("Some Award");
    const awardValue = values(section)[1] as HTMLElement;
    expect(awardValue.textContent).toBe("");
  });

  /* ── Full integration ──────────────────────────────────── */

  it("renders all movie fields in correct order", () => {
    const section = buildDetails(
      makeData({
        info: infoWith({
          aliases: "肖申克的救赎",
          cast: [
            { href: "", text: "Tim Robbins" },
            { href: "", text: "Morgan Freeman" },
          ],
          country: "美国",
          director: [{ href: "/dir/", text: "Frank Darabont" }],
          genres: ["剧情", "犯罪"],
          imdb: "tt0111161",
          language: "英语",
          releaseDate: "1994-09-23",
          runtime: "142分钟",
          writers: [{ href: "", text: "Stephen King" }],
        }),
        isTV: false,
      })
    ) as HTMLElement;

    const expectedLabels = [
      "导演",
      "编剧",
      "主演",
      "类型",
      "制片国家/地区",
      "语言",
      "上映日期",
      "片长",
      "又名",
      "IMDb",
    ];

    const foundLabels = labels(section);
    expect(foundLabels).toHaveLength(expectedLabels.length);
    for (let i = 0; i < expectedLabels.length; i += 1) {
      expect(foundLabels[i]?.textContent).toBe(expectedLabels[i]);
    }
  });

  /* ── Section structure ─────────────────────────────────── */

  it("returns a section with id atv-info and class atv-section", () => {
    const data = makeData({
      info: infoWith({ country: "美国" }),
    });
    const section = buildDetails(data) as HTMLElement;

    expect(section.tagName).toBe("SECTION");
    expect(section.id).toBe("atv-info");
    expect(section.className).toBe("atv-section");
  });

  it("section contains an h2 header with 详细信息 text", () => {
    const section = buildDetails(
      makeData({
        info: infoWith({ country: "美国" }),
      })
    ) as HTMLElement;

    const header = section.querySelector("h2.atv-section-h");
    expect(header).not.toBeNull();
    expect(header?.textContent).toBe("详细信息");
  });

  it("section contains a div.atv-info-grid child", () => {
    const section = buildDetails(
      makeData({
        info: infoWith({ country: "美国" }),
      })
    ) as HTMLElement;

    const grid = section.querySelector("div.atv-info-grid");
    expect(grid).not.toBeNull();
  });
});
