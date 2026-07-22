import { describe, expect, it } from "vitest";

import type { PersonageWorkRail as PersonageWorkRailData } from "@/modules/personage/domain";
import { PersonageWorkRail } from "@/modules/personage/presentation/works";

import { renderIntoRoot } from "../../helpers/render";

const recentWorks: PersonageWorkRailData = {
  allWorksHref:
    "https://www.douban.com/personage/27260187/creations?sortby=time&type=filmmaker",
  works: [
    {
      href: "https://movie.douban.com/subject/10001/",
      poster: "https://img.example.com/recent.jpg",
      rating: "8.2",
      title: "近期作品",
      year: "2011",
    },
  ],
};

describe(PersonageWorkRail, () => {
  it("renders the recent-work rail and preserves its native complete directory", () => {
    const root = renderIntoRoot(
      <PersonageWorkRail
        id="atv-personage-recent-works"
        rail={recentWorks}
        title="近期作品"
      />
    );
    const exit = root.querySelector<HTMLAnchorElement>(".atv-section-more");

    expect(root.querySelector("h2")?.textContent).toBe("近期作品");
    expect(root.querySelector(".atv-personage-work-rail")).not.toBeNull();
    expect([exit?.href, exit?.target, exit?.rel]).toStrictEqual([
      "https://www.douban.com/personage/27260187/creations?sortby=time&type=filmmaker",
      "_blank",
      "noopener",
    ]);
  });

  it("does not render an empty rail", () => {
    const root = renderIntoRoot(
      <PersonageWorkRail
        id="atv-personage-representative-works"
        rail={{ ...recentWorks, works: [] }}
        title="代表作品"
      />
    );

    expect(root.firstElementChild).toBeNull();
  });

  it("wraps five work cards in a flex-wrap layout without overflow clipping", () => {
    const root = renderIntoRoot(
      <PersonageWorkRail
        id="atv-personage-recent-works"
        rail={{
          ...recentWorks,
          works: Array.from({ length: 5 }, (_, index) => ({
            ...recentWorks.works[0],
            href: `https://movie.douban.com/subject/${index}/`,
            title: `Work ${index + 1}`,
          })),
        }}
        title="近期作品"
      />
    );

    const rail = root.querySelector(".atv-personage-work-rail");
    expect(rail).not.toBeNull();
    expect(rail?.querySelectorAll(".atv-personage-work-card")).toHaveLength(5);
  });
});
