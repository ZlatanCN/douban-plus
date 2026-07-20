import { describe, expect, it } from "vitest";

import { PersonageCollaborators } from "@/modules/personage/collaborators";
import type { PersonageCollaborator } from "@/modules/personage/types";

import { renderIntoRoot } from "../../helpers/render";

const collaborators: PersonageCollaborator[] = [
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

describe(PersonageCollaborators, () => {
  it("presents loaded collaborators as an ordered credit list", () => {
    const root = renderIntoRoot(
      <PersonageCollaborators collaborators={collaborators} />
    );
    const entries = [
      ...root.querySelectorAll<HTMLElement>(".atv-personage-collaborator"),
    ];

    expect(
      root.querySelector("#atv-personage-collaborators h2")?.textContent
    ).toBe("常合作的人");
    expect(
      entries.map((entry) => [
        entry.querySelector(".atv-personage-collaborator-rank")?.textContent,
        entry.querySelector("h3")?.textContent,
        entry.querySelector("strong")?.textContent,
        [...entry.querySelectorAll("a")].map((link) => link.textContent),
      ])
    ).toStrictEqual([
      ["01", "合作者甲", "20", ["查看共同作品", "查看人物"]],
      ["02", "合作者乙", "12", ["查看共同作品", "查看人物"]],
      ["03", "合作者丙", "9", ["查看共同作品", "查看人物"]],
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
      [
        "查看共同作品",
        "https://www.douban.com/personage/0/partners#1",
        "_blank",
      ],
      ["查看人物", "https://www.douban.com/personage/1", "_blank"],
      [
        "查看共同作品",
        "https://www.douban.com/personage/0/partners#2",
        "_blank",
      ],
      ["查看人物", "https://www.douban.com/personage/2", "_blank"],
      [
        "查看共同作品",
        "https://www.douban.com/personage/0/partners#3",
        "_blank",
      ],
      ["查看人物", "https://www.douban.com/personage/3", "_blank"],
    ]);
  });
});
