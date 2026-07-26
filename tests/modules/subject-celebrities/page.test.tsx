import { render } from "preact";
import { afterEach, describe, expect, it } from "vitest";

import type { SubjectCelebritiesPageData } from "@/modules/subject-celebrities/domain";
import { SubjectCelebritiesPage } from "@/modules/subject-celebrities/presentation/page";

const data: SubjectCelebritiesPageData = {
  groups: [
    {
      credits: [
        {
          avatar: "https://img.example.com/director.jpg",
          credit: "导演 Director",
          href: "https://www.douban.com/personage/1/",
          name: "导演甲 Director A",
          works: [
            { href: "https://movie.douban.com/subject/1/", title: "作品甲" },
          ],
        },
      ],
      title: "导演 Director",
    },
    {
      credits: [
        {
          avatar: null,
          credit: null,
          href: null,
          name: "无肖像演职员",
          works: [],
        },
      ],
      title: "动作特技 Action or Stunts",
    },
  ],
  subjectHref: "https://movie.douban.com/subject/34825964/",
  subjectId: "34825964",
  title: "龙之家族 第一季",
};

describe(SubjectCelebritiesPage, () => {
  const root = document.createElement("div");

  afterEach(() => {
    render(null, root);
  });

  it("renders every group as a credit sheet", () => {
    render(<SubjectCelebritiesPage data={data} doc={document} />, root);

    expect(root.querySelector("h1")?.textContent).toBe("龙之家族 第一季");
    expect(root.textContent).toContain("2 位演职员");
    expect(root.querySelectorAll(".atv-credit-group")).toHaveLength(2);
    expect(root.textContent).toContain("导演甲");
    expect(root.textContent).toContain("无肖像演职员");
  });

  it("anchors each group marker to its title", () => {
    render(<SubjectCelebritiesPage data={data} doc={document} />, root);

    expect(
      root.querySelector(".atv-credit-group-heading")?.firstElementChild
        ?.tagName
    ).toBe("H2");
  });

  it("uses Chinese-only labels for credit groups and roles", () => {
    render(<SubjectCelebritiesPage data={data} doc={document} />, root);

    const headings = root.querySelectorAll(".atv-credit-group-heading h2");
    expect(headings[0]?.textContent).toBe("导演");
    expect(headings[1]?.textContent).toBe("动作特技");
    expect(root.querySelector(".atv-credit-group-heading p")?.textContent).toBe(
      "1 位"
    );
    expect(root.querySelector(".atv-credit-role")?.textContent).toBe("导演");
  });

  it("gives Chinese and original names distinct hierarchy", () => {
    render(<SubjectCelebritiesPage data={data} doc={document} />, root);

    expect(root.querySelector(".atv-credit-name-primary")?.textContent).toBe(
      "导演甲"
    );
    expect(root.querySelector(".atv-credit-name-original")?.textContent).toBe(
      "Director A"
    );
  });

  it("keeps character credits while demoting their original names", () => {
    const actorData: SubjectCelebritiesPageData = {
      ...data,
      groups: [
        {
          ...data.groups[0],
          credits: [
            {
              ...data.groups[0].credits[0],
              credit: "演员 Actor (饰 雷妮拉·坦格利安 Rhaenyra Targaryen)",
            },
          ],
        },
      ],
    };
    render(<SubjectCelebritiesPage data={actorData} doc={document} />, root);

    expect(root.querySelector(".atv-credit-role-title")?.textContent).toBe(
      "演员"
    );
    expect(root.querySelector(".atv-credit-character-name")?.textContent).toBe(
      "雷妮拉·坦格利安"
    );
    expect(
      root.querySelector(".atv-credit-character-original")?.textContent
    ).toBe("Rhaenyra Targaryen");
  });

  it("provides graceful avatar fallbacks and safe outbound links", () => {
    render(<SubjectCelebritiesPage data={data} doc={document} />, root);

    expect(root.querySelector(".atv-credit-avatar.is-empty")).not.toBeNull();
    expect(
      root.querySelector<HTMLAnchorElement>(".atv-credit-person")?.target
    ).toBe("_blank");
    expect(
      root.querySelector<HTMLAnchorElement>(".atv-credit-work")?.target
    ).toBe("_blank");
    expect(
      root.querySelector<HTMLAnchorElement>(".atv-credit-back")?.target
    ).toBe("_blank");
  });
});
