import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReviewsSection } from "@/modules/subject-page/reviews";
import { ReviewModal } from "@/modules/subject-page/reviews/review-modal";
import type { Review, ReviewData } from "@/types";

import { renderIntoRoot } from "../../helpers/render";

const makeReview = (overrides?: Partial<Review>): Review => ({
  avatar: "",
  content: "A must-see classic.",
  id: "r1",
  link: "",
  name: "TestUser",
  ratingWord: "",
  spoiler: false,
  stars: 0,
  time: "2024-01-15",
  title: "Great movie with deep meaning",
  usefulCount: 5,
  uselessCount: 1,
  ...overrides,
});

const makeData = (overrides?: Partial<ReviewData>): ReviewData => ({
  isTV: false,
  reviews: [makeReview()],
  subjectId: "1292052",
  ...overrides,
});

const appendNativeReview = (
  rid = "r1",
  fullHtml = '<p style="color:red">Full review content.</p>'
): HTMLElement => {
  const numericId = rid.match(/(?<num>\d+)$/u)?.groups?.num ?? rid;
  const nativeItem = document.createElement("div");
  nativeItem.className = "review-item";
  nativeItem.id = rid;
  nativeItem.innerHTML = `<div id="review_${numericId}_full"><div class="review-content">${fullHtml}</div></div>`;
  document.body.append(nativeItem);
  return nativeItem;
};

const renderReviews = (
  data = makeData(),
  options?: {
    canVote?: () => boolean;
    onOpen?: (review: Review) => void;
    onVote?: (
      rid: string,
      type: "useful" | "useless"
    ) => Promise<{ ok: boolean; usefulCount?: number; uselessCount?: number }>;
  }
) =>
  renderIntoRoot(
    <ReviewsSection
      canVote={options?.canVote}
      isTV={data.isTV}
      onOpen={options?.onOpen ?? vi.fn<(review: Review) => void>()}
      onVote={options?.onVote}
      reviews={data.reviews}
      subjectId={data.subjectId}
    />
  );

describe(ReviewsSection, () => {
  beforeEach(() => {
    for (const item of document.querySelectorAll(".review-item")) {
      item.remove();
    }
    /* eslint-disable promise/prefer-await-to-callbacks -- requestAnimationFrame is callback-based. */
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(
      (callback: FrameRequestCallback): number => {
        callback(0);
        return 0;
      }
    );
    /* eslint-enable promise/prefer-await-to-callbacks */
    vi.stubGlobal(
      "fetch",
      vi.fn<() => Promise<never>>(() =>
        Promise.reject(new Error("network disabled in test"))
      )
    );
  });
  it("renders nothing when reviews are empty", () => {
    const root = renderReviews(makeData({ reviews: [] }));

    expect(root.firstElementChild).toBeNull();
  });

  it("renders movie and TV section titles with more link", () => {
    const movie = renderReviews();
    const tv = renderReviews(makeData({ isTV: true }));
    const more = movie.querySelector<HTMLAnchorElement>(".atv-section-more");

    expect(movie.querySelector("#atv-reviews h2")?.textContent).toBe(
      "热门影评"
    );
    expect(tv.querySelector("#atv-reviews h2")?.textContent).toBe("热门剧评");
    expect(more?.href).toBe("https://movie.douban.com/subject/1292052/reviews");
  });

  it("renders a separate open button for the review card", () => {
    const root = renderReviews(
      makeData({
        reviews: [
          makeReview({
            avatar: "https://example.com/avatar.jpg",
            id: "r123",
            link: "https://douban.com/people/u1/",
            name: "Alice",
            stars: 4,
            usefulCount: 10,
            uselessCount: 2,
          }),
        ],
      })
    );
    const card = root.querySelector<HTMLElement>(".atv-review-card");
    const openButton = root.querySelector<HTMLButtonElement>(
      ".atv-review-open-button"
    );

    expect(card?.dataset.rid).toBe("r123");
    expect(card?.tagName).toBe("ARTICLE");
    expect(openButton?.getAttribute("aria-label")).toBe(
      "展开阅读：Great movie with deep meaning"
    );
    expect(openButton?.tagName).toBe("BUTTON");
  });

  it("does not nest author links or vote buttons inside the open button", () => {
    const root = renderReviews(
      makeData({
        reviews: [
          makeReview({
            id: "r123",
            link: "https://douban.com/people/u1/",
            name: "Alice",
          }),
        ],
      })
    );
    const openButton = root.querySelector<HTMLButtonElement>(
      ".atv-review-open-button"
    );

    expect(
      openButton?.contains(root.querySelector(".atv-review-author"))
    ).toBeFalsy();
    expect(
      openButton?.contains(root.querySelector(".atv-vote-btn"))
    ).toBeFalsy();
  });

  it("renders author link, stars, excerpt and vote counts", () => {
    const root = renderReviews(
      makeData({
        reviews: [
          makeReview({
            avatar: "https://example.com/avatar.jpg",
            id: "r123",
            link: "https://douban.com/people/u1/",
            name: "Alice",
            stars: 4,
            usefulCount: 10,
            uselessCount: 2,
          }),
        ],
      })
    );
    const author = root.querySelector<HTMLAnchorElement>(".atv-review-author");

    expect(author?.href).toBe("https://douban.com/people/u1/");
    expect(root.querySelector(".atv-review-stars")).not.toBeNull();
    expect(root.querySelector(".atv-review-excerpt")?.textContent).toBe(
      "A must-see classic."
    );
  });

  it("renders review votes as accessible triangle toggles", () => {
    const root = renderReviews(
      makeData({
        reviews: [
          makeReview({
            usefulCount: 10,
            uselessCount: 2,
          }),
        ],
      })
    );
    const up = root.querySelector<HTMLButtonElement>(".atv-vote-btn.up");
    const down = root.querySelector<HTMLButtonElement>(".atv-vote-btn.down");

    expect(up?.textContent).toContain("10");
    expect(up?.getAttribute("aria-label")).toBe("有用，10 人觉得有用");
    expect(up?.getAttribute("aria-pressed")).toBe("false");
    expect(down?.textContent).toContain("2");
  });

  it("renders the down review vote as a separate negative toggle", () => {
    const root = renderReviews(
      makeData({
        reviews: [
          makeReview({
            usefulCount: 10,
            uselessCount: 2,
          }),
        ],
      })
    );
    const up = root.querySelector<HTMLButtonElement>(".atv-vote-btn.up");
    const down = root.querySelector<HTMLButtonElement>(".atv-vote-btn.down");

    expect(up?.querySelector("svg")).not.toBeNull();
    expect(down?.getAttribute("aria-label")).toBe("没用，2 人觉得没用");
    expect(down?.getAttribute("aria-pressed")).toBe("false");
    expect(down?.querySelector("svg")).not.toBeNull();
  });

  it("does not open the modal when clicking the author link", async () => {
    const root = renderReviews(
      makeData({
        reviews: [
          makeReview({
            link: "https://douban.com/people/u1/",
            name: "Alice",
          }),
        ],
      })
    );
    const author = root.querySelector<HTMLAnchorElement>(".atv-review-author");
    author?.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    });

    author?.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true })
    );
    await Promise.resolve();

    expect(root.querySelector("#atv-review-modal")).toBeNull();
  });

  it("calls onOpen with the review when the card is clicked", async () => {
    appendNativeReview("r123", '<p style="color:red">Full review content.</p>');
    const onOpen = vi.fn<() => void>();
    const data = makeData({ reviews: [makeReview({ id: "r123", name: "" })] });
    const root = renderIntoRoot(
      <ReviewsSection
        isTV={data.isTV}
        onOpen={onOpen}
        reviews={data.reviews}
        subjectId={data.subjectId}
      />
    );

    root.querySelector<HTMLElement>(".atv-review-open-button")?.click();
    await Promise.resolve();

    expect(onOpen).toHaveBeenCalledWith(data.reviews[0]);
  });

  it("does not optimistically vote when the account guard blocks", async () => {
    const canVote = vi.fn<() => boolean>(() => false);
    const onVote = vi.fn<
      () => Promise<{
        ok: boolean;
        usefulCount?: number;
        uselessCount?: number;
      }>
    >(() => Promise.resolve({ ok: true, usefulCount: 6 }));
    const root = renderReviews(undefined, { canVote, onVote });

    root.querySelector<HTMLButtonElement>(".atv-vote-btn.up")?.click();
    await Promise.resolve();

    expect(canVote).toHaveBeenCalledOnce();
    expect(onVote).not.toHaveBeenCalled();
    expect(root.querySelector(".atv-vote-btn.up")?.textContent).toContain("5");
  });

  it("updates vote state after a successful vote", async () => {
    const onVote = vi.fn<
      () => Promise<{
        ok: boolean;
        usefulCount?: number;
        uselessCount?: number;
      }>
    >(() => Promise.resolve({ ok: true, usefulCount: 12, uselessCount: 1 }));
    const root = renderReviews(undefined, { onVote });

    root.querySelector<HTMLButtonElement>(".atv-vote-btn.up")?.click();
    await Promise.resolve();
    await Promise.resolve();

    const up = root.querySelector<HTMLButtonElement>(".atv-vote-btn.up");
    expect(onVote).toHaveBeenCalledWith("1", "useful");
    expect(up?.classList.contains("is-voted")).toBeTruthy();
    expect(up?.textContent).toContain("12");
  });

  it("renders the stable review-content failure state in the modal", async () => {
    const root = renderIntoRoot(
      <ReviewModal onClose={vi.fn<() => void>()} review={makeReview()} />
    );

    await vi.waitFor(() =>
      expect(root.querySelector(".atv-review-modal-body")?.classList).toContain(
        "is-error"
      )
    );

    expect(
      root.querySelector(".atv-review-modal-error")?.textContent
    ).toContain("影评内容暂时加载失败");
  });
});
