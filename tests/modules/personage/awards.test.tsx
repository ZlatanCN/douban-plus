import { describe, expect, it } from "vitest";

import type { PersonageAwards } from "@/modules/personage/domain";
import { PersonageAwardsSection } from "@/modules/personage/presentation/awards";

import { renderIntoRoot } from "../../helpers/render";

const populatedAwards: PersonageAwards = {
  allAwardsHref: "https://www.douban.com/personage/27260166/awards",
  awards: [
    {
      award: "最佳导演 (提名)",
      ceremony: "第38届大众电影百花奖",
      ceremonyHref: "https://movie.douban.com/awards/hundred-flowers/38/",
      work: "惊蛰无声",
      workHref: "https://movie.douban.com/subject/37242440/",
      year: "2026年",
    },
  ],
};

describe(PersonageAwardsSection, () => {
  it("renders awards and preserves the native complete directory", () => {
    const root = renderIntoRoot(
      <PersonageAwardsSection awards={populatedAwards} />
    );
    const exit = root.querySelector<HTMLAnchorElement>(".atv-section-more");

    expect(root.querySelector("h2")?.textContent).toBe("荣誉");
    expect(root.querySelector(".atv-personage-award-year")?.textContent).toBe(
      "2026年"
    );
    expect(root.querySelector(".atv-personage-award-name")?.textContent).toBe(
      "最佳导演 (提名)"
    );
    expect(
      [".atv-personage-award-ceremony a", ".atv-personage-award-work a"].map(
        (selector) => {
          const link = root.querySelector<HTMLAnchorElement>(selector);

          return [link?.href, link?.target, link?.rel];
        }
      )
    ).toStrictEqual([
      [
        "https://movie.douban.com/awards/hundred-flowers/38/",
        "_blank",
        "noreferrer",
      ],
      ["https://movie.douban.com/subject/37242440/", "_blank", "noreferrer"],
    ]);
    expect([exit?.href, exit?.target, exit?.rel]).toStrictEqual([
      "https://www.douban.com/personage/27260166/awards",
      "_blank",
      "noopener",
    ]);
  });

  it("renders an intentional empty state when the native awards source is empty", () => {
    const root = renderIntoRoot(
      <PersonageAwardsSection awards={{ ...populatedAwards, awards: [] }} />
    );

    expect(root.querySelector(".atv-personage-awards-empty")?.textContent).toBe(
      "暂无公开获奖记录"
    );
  });

  it("omits the section when the native awards source is absent", () => {
    const root = renderIntoRoot(<PersonageAwardsSection awards={null} />);

    expect(root.firstElementChild).toBeNull();
  });
});
