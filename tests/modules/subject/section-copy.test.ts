import { describe, expect, it } from "vitest";

import { getSubjectSectionCopy } from "@/modules/subject/section-copy";

describe(getSubjectSectionCopy, () => {
  it("returns the confirmed navigation labels and page titles", () => {
    expect([
      getSubjectSectionCopy("streaming"),
      getSubjectSectionCopy("series"),
      getSubjectSectionCopy("cast"),
      getSubjectSectionCopy("media"),
      getSubjectSectionCopy("comments"),
      getSubjectSectionCopy("movieReviews"),
      getSubjectSectionCopy("tvReviews"),
      getSubjectSectionCopy("recommendations"),
      getSubjectSectionCopy("details"),
    ]).toStrictEqual([
      { navLabel: "观看平台", sectionTitle: "观看平台" },
      { navLabel: "同系列", sectionTitle: "同系列作品" },
      { navLabel: "演职员", sectionTitle: "演职员" },
      { navLabel: "影像", sectionTitle: "影像" },
      { navLabel: "短评", sectionTitle: "热门短评" },
      { navLabel: "影评", sectionTitle: "热门影评" },
      { navLabel: "剧评", sectionTitle: "热门剧评" },
      { navLabel: "相似作品", sectionTitle: "相似作品" },
      { navLabel: "详情", sectionTitle: "详细信息" },
    ]);
  });
});
