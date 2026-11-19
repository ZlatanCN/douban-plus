import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { extractPersonageProfile } from "@/modules/personage/extract/profile";

import { createTestDoc } from "../../helpers/doc";

const personageFixture = readFileSync(
  path.resolve(process.cwd(), "tests/fixtures/personage-full.html"),
  "utf-8"
);

describe(extractPersonageProfile, () => {
  it("extracts the Hero identity, facts, portrait, and biography from a personage document", () => {
    const { cleanup, doc } = createTestDoc(
      personageFixture,
      "/personage/27224733/"
    );

    expect(extractPersonageProfile(doc)).toStrictEqual({
      awards: {
        allAwardsHref: "http://localhost:3000/awards",
        awards: [
          {
            award: "最佳男演员 (提名)",
            ceremony: "示例电影节",
            ceremonyHref: "https://movie.douban.com/awards/example/1/",
            work: "代表作品",
            workHref: "https://movie.douban.com/subject/20002/",
            year: "2024年",
          },
        ],
        totalCount: 2,
      },
      biography: [
        "彼特·丁拉基是一位美国演员，以细腻而有力量的表演闻名。",
        "他因出演《权力的游戏》中的提利昂·兰尼斯特而广为人知。",
      ],
      collaborators: {
        allCollaboratorsHref:
          "http://localhost:3000/personage/27224733/partners",
        collaborators: [
          {
            avatar: "https://img.example.com/b.jpg",
            href: "https://www.douban.com/personage/2",
            name: "合作者乙",
            sharedWorkCount: 20,
            sharedWorksHref:
              "http://localhost:3000/personage/27224733/partners#2",
          },
          {
            avatar: "https://img.example.com/a.jpg",
            href: "https://www.douban.com/personage/1",
            name: "合作者甲",
            sharedWorkCount: 12,
            sharedWorksHref:
              "http://localhost:3000/personage/27224733/partners#1",
          },
          {
            avatar: "https://img.example.com/c.jpg",
            href: "https://www.douban.com/personage/3",
            name: "合作者丙",
            sharedWorkCount: 12,
            sharedWorksHref:
              "http://localhost:3000/personage/27224733/partners#3",
          },
        ],
        totalCount: 3,
      },
      facts: [
        { label: "性别", value: "男" },
        { label: "出生日期", value: "1969-06-11" },
        { label: "职业", value: "演员 / 制片人" },
      ],
      gallery: {
        allImagesHref: "http://localhost:3000/photos",
        images: [
          {
            alt: "",
            largeSrc:
              "https://img.example.com/view/photo/l/public/peter-1.webp",
            src: "https://img.example.com/view/photo/photo/public/peter-1.webp",
          },
          {
            alt: "",
            largeSrc:
              "https://img.example.com/view/photo/l/public/peter-2.webp",
            src: "https://img.example.com/view/photo/photo/public/peter-2.webp",
          },
        ],
      },
      id: "27224733",
      name: "彼特·丁拉基 Peter Dinklage",
      portrait: "https://img.example.com/peter.jpg",
      recentWorks: {
        allWorksHref:
          "http://localhost:3000/creations?sortby=time&type=filmmaker",
        totalCount: 2,
        works: [
          {
            href: "https://movie.douban.com/subject/10001/",
            poster: "https://img.example.com/recent.jpg",
            rating: "8.2",
            title: "近期作品",
            year: "2011",
          },
        ],
      },
      representativeWorks: {
        allWorksHref:
          "http://localhost:3000/creations?sortby=collection&type=filmmaker",
        totalCount: 2,
        works: [
          {
            href: "https://movie.douban.com/subject/20002/",
            poster: "https://img.example.com/representative.jpg",
            rating: "9.1",
            title: "代表作品",
            year: "1999",
          },
        ],
      },
    });

    cleanup();
  });

  it("extracts a name when the native personage markup has no heading element", () => {
    const { cleanup, doc } = createTestDoc(
      `
        <div class="subject-target">
          <div class="subject-name">娜奥米·沃茨 Naomi Watts</div>
        </div>
      `,
      "/personage/27260187/"
    );

    expect(extractPersonageProfile(doc)?.name).toBe("娜奥米·沃茨 Naomi Watts");

    cleanup();
  });
});
