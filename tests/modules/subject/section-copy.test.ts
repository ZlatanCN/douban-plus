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
      { navLabel: "片源", sectionTitle: "片源" },
      { navLabel: "系列", sectionTitle: "系列" },
      { navLabel: "演职员", sectionTitle: "演职员" },
      { navLabel: "影像", sectionTitle: "影像" },
      { navLabel: "短评", sectionTitle: "短评" },
      { navLabel: "影评", sectionTitle: "影评" },
      { navLabel: "剧评", sectionTitle: "剧评" },
      { navLabel: "推荐", sectionTitle: "推荐" },
      { navLabel: "详情", sectionTitle: "详情" },
    ]);
  });
});
