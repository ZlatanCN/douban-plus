import { describe, expect, it } from "vitest";

import { getSubjectSectionCopy } from "@/modules/subject/navigation/section-copy";

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
      "片源",
      "系列",
      "演职员",
      "影像",
      "短评",
      "影评",
      "剧评",
      "推荐",
      "详情",
    ]);
  });
});
