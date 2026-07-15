import { describe, expect, it } from "vitest";

import { extractRankLabel } from "@/extract/rank-label";

import { buildDoc } from "../helpers/doc";

describe(extractRankLabel, () => {
  it("extracts a ranked collection's position, title, and safe destination", () => {
    const doc = buildDoc(`<!DOCTYPE html><html><body>
      <div class="rank-label rank-label-other">
        <span class="rank-label-no"><span>No.12</span></span>
        <span class="rank-label-link"><a href="https://m.douban.com/subject_collection/ECVACWVGI" target="_blank">高分经典美剧榜</a></span>
      </div>
    </body></html>`);

    expect(extractRankLabel(doc)).toStrictEqual({
      href: "https://m.douban.com/subject_collection/ECVACWVGI",
      position: "No.12",
      title: "高分经典美剧榜",
    });
  });

  it("returns null when the subject has no rank label", () => {
    expect(extractRankLabel(buildDoc("<html><body /></html>"))).toBeNull();
  });
});
