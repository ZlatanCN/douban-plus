import { describe, expect, it, vi } from "vitest";

import { ReviewCard } from "@/domains/review-reader";
import type { Review } from "@/domains/review-reader";

import { renderIntoRoot } from "../../helpers/render";

const review: Review = {
  avatar: "https://example.com/avatar.jpg",
  content: "这是一段用于验证目录阅读节奏的影评摘要。",
  id: "4931491",
  link: "https://movie.douban.com/people/example/",
  name: "影迷",
  ratingWord: "力荐",
  spoiler: false,
  stars: 4,
  time: "2011-04-18 12:00:00",
  title: "一篇可读的影评标题",
  usefulCount: 21,
  uselessCount: 3,
};

describe(ReviewCard, () => {
  it("uses a distinct identity rail and reading column for the directory layout", () => {
    const root = renderIntoRoot(
      <ReviewCard
        layout="directory"
        onOpen={vi.fn<(review: Review) => void>()}
        review={review}
      />
    );

    const card = root.querySelector(".atv-review-card.is-directory");
    const identity = root.querySelector(".atv-review-directory-identity");
    const reading = root.querySelector(".atv-review-directory-reading");

    expect({
      author: identity?.querySelector(".atv-review-author")?.textContent,
      directoryTimeParent:
        identity?.querySelector(".atv-review-time")?.parentElement?.className,
      hasActions: Boolean(
        reading?.querySelector(".atv-review-foot .atv-review-actions")
      ),
      hasAvatar: Boolean(identity?.querySelector(".atv-review-avatar")),
      hasCard: Boolean(card),
      hasCompactTop: Boolean(
        root.querySelector(".atv-review-card.is-directory .atv-review-top")
      ),
      title: reading?.querySelector(".atv-review-title")?.textContent,
    }).toStrictEqual({
      author: "影迷",
      directoryTimeParent: "atv-review-meta",
      hasActions: true,
      hasAvatar: true,
      hasCard: true,
      hasCompactTop: false,
      title: "一篇可读的影评标题",
    });
  });

  it("keeps the subject-page card in its compact structure", () => {
    const root = renderIntoRoot(
      <ReviewCard onOpen={vi.fn<(review: Review) => void>()} review={review} />
    );

    expect(root.querySelector(".atv-review-card.is-compact")).not.toBeNull();
    expect(root.querySelector(".atv-review-directory-identity")).toBeNull();
    expect(root.querySelector(".atv-review-top")).not.toBeNull();
  });
});
