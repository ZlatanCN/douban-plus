import { describe, expect, it } from "vitest";

import type {
  PersonageCollaborator,
  PersonageCollaborators as PersonageCollaboratorsData,
} from "@/modules/personage/domain";
import { PersonageCollaborators } from "@/modules/personage/presentation/collaborators";

import { renderIntoRoot } from "../../helpers/render";

const entries: PersonageCollaborator[] = [
  {
    avatar: "https://img.example.com/a.jpg",
    href: "https://www.douban.com/personage/1",
    name: "合作者甲",
    sharedWorkCount: 20,
    sharedWorksHref: "https://www.douban.com/personage/0/partners#1",
  },
  {
    avatar: "https://img.example.com/b.jpg",
    href: "https://www.douban.com/personage/2",
    name: "合作者乙",
    sharedWorkCount: 12,
    sharedWorksHref: "https://www.douban.com/personage/0/partners#2",
  },
  {
    avatar: "https://img.example.com/c.jpg",
    href: "https://www.douban.com/personage/3",
    name: "合作者丙",
    sharedWorkCount: 9,
    sharedWorksHref: "https://www.douban.com/personage/0/partners#3",
  },
];

const collaborators: PersonageCollaboratorsData = {
  allCollaboratorsHref: "https://www.douban.com/personage/0/partners",
  collaborators: entries,
};

describe(PersonageCollaborators, () => {
  it("presents loaded collaborators as an ordered credit list", () => {
    const root = renderIntoRoot(
      <PersonageCollaborators collaborators={collaborators} />
    );
    const renderedEntries = [
      ...root.querySelectorAll<HTMLElement>(".atv-personage-collaborator"),
    ];

    expect(
      root.querySelector("#atv-personage-collaborators h2")?.textContent
    ).toBe("合作");
    expect(
      root.querySelector<HTMLAnchorElement>(
        "#atv-personage-collaborators .atv-section-more"
      )
    ).toMatchObject({
      href: "https://www.douban.com/personage/0/partners",
      target: "_blank",
      textContent: "查看全部 →",
    });
    expect(
      renderedEntries.map((entry) => [
        entry.querySelector(".atv-personage-collaborator-rank")?.textContent,
        entry.querySelector(".atv-personage-collaborator-name")?.textContent,
        entry.querySelector(".atv-personage-collaborator-count")?.textContent,
        [...entry.querySelectorAll("a")].map((link) => link.textContent),
      ])
    ).toStrictEqual([
      ["1", "合作者甲", "20 次合作", ["合作者甲", "查看共同作品 ↗"]],
      ["2", "合作者乙", "12 次合作", ["合作者乙", "查看共同作品 ↗"]],
      ["3", "合作者丙", "9 次合作", ["合作者丙", "查看共同作品 ↗"]],
    ]);
    expect(root.querySelector("svg")).toBeNull();
    expect(root.querySelector("button")).toBeNull();
  });

  it("keeps person and shared-work destinations explicit for every collaborator", () => {
    const root = renderIntoRoot(
      <PersonageCollaborators collaborators={collaborators} />
    );

    expect(
      [
        ...root.querySelectorAll<HTMLAnchorElement>(
          ".atv-personage-collaborator a"
        ),
      ].map((link) => [link.textContent, link.href, link.target])
    ).toStrictEqual([
      ["合作者甲", "https://www.douban.com/personage/1", "_blank"],
      [
        "查看共同作品 ↗",
        "https://www.douban.com/personage/0/partners#1",
        "_blank",
      ],
      ["合作者乙", "https://www.douban.com/personage/2", "_blank"],
      [
        "查看共同作品 ↗",
        "https://www.douban.com/personage/0/partners#2",
        "_blank",
      ],
      ["合作者丙", "https://www.douban.com/personage/3", "_blank"],
      [
        "查看共同作品 ↗",
        "https://www.douban.com/personage/0/partners#3",
        "_blank",
      ],
    ]);
  });
});
