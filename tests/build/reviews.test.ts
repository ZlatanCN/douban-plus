/* ── buildReviews — Unit Tests ──────────────────────────── */
/* Tests the reviews section builder for rendering long-form */
/* review cards with avatar, author, title, excerpt, footer.  */

import { describe, it, expect, vi } from "vitest";

import { buildReviews } from "../../src/build";
import type { Review, ReviewData } from "../../src/types";

/* ── Factory helpers ─────────────────────────────────────── */

const makeReview = (overrides?: Partial<Review>): Review => ({
  avatar: "",
  content:
    "This is a wonderful film that everyone should watch at least once...",
  id: "",
  link: "",
  name: "TestUser",
  ratingWord: "",
  spoiler: false,
  stars: 0,
  time: "2024-01-15",
  title: "Great movie with deep meaning",
  usefulCount: 0,
  uselessCount: 0,
  ...overrides,
});

const makeData = (overrides?: Partial<ReviewData>): ReviewData => ({
  isTV: false,
  reviews: [makeReview({ id: "r1" })],
  subjectId: "1292052",
  ...overrides,
});

const appendNativeReview = (
  rid = "r1",
  fullHtml = "<p>Full review content.</p>"
): HTMLElement => {
  const numericId = rid.match(/(?<num>\d+)$/u)?.groups?.num ?? rid;
  const nativeItem = document.createElement("div");
  nativeItem.className = "review-item";
  nativeItem.id = rid;
  nativeItem.innerHTML = `<div id="review_${numericId}_full"><div class="review-content">${fullHtml}</div></div>`;
  document.body.append(nativeItem);
  return nativeItem;
};

const openModalForReview = (review: Review): HTMLElement => {
  const section = buildReviews(
    makeData({
      reviews: [review],
    })
  ) as HTMLElement;
  const card = section.querySelector(".atv-review-card") as HTMLElement;
  card.click();
  return document.querySelector("#atv-review-modal") as HTMLElement;
};

/* ── Tests ─────────────────────────────────────────────────── */

/* eslint-disable promise/prefer-await-to-callbacks */
const mockRaf = ((cb: FrameRequestCallback) => {
  cb(0);
  return 0;
}) as typeof window.requestAnimationFrame;
/* eslint-enable promise/prefer-await-to-callbacks */

describe("buildReviews", () => {
  /* ── Null return ────────────────────────────────────────── */

  it("returns null when reviews array is empty (t1)", () => {
    expect(buildReviews(makeData({ reviews: [] }))).toBeNull();
  });

  /* ── Section structure ─────────────────────────────────── */

  it("returns a section with class atv-section and id atv-reviews (t2)", () => {
    const section = buildReviews(makeData()) as HTMLElement;
    expect(section.tagName).toBe("SECTION");
    expect(section.id).toBe("atv-reviews");
    expect(section.classList.contains("atv-section")).toBe(true);
  });

  it("section has h2 header with 最热影评 text for movie (t3)", () => {
    const section = buildReviews(makeData()) as HTMLElement;
    const header = section.querySelector("h2.atv-section-h");
    expect(header).not.toBeNull();
    expect(header?.textContent).toBe("最热影评");
  });

  it("section has h2 header with 最热剧评 text for TV show (t3b)", () => {
    const section = buildReviews(makeData({ isTV: true })) as HTMLElement;
    const header = section.querySelector("h2.atv-section-h");
    expect(header).not.toBeNull();
    expect(header?.textContent).toBe("最热剧评");
  });

  it("section contains div.atv-reviews grid child (t4)", () => {
    const section = buildReviews(makeData()) as HTMLElement;
    const grid = section.querySelector("div.atv-reviews");
    expect(grid).not.toBeNull();
  });

  /* ── Review card structure ─────────────────────────────── */

  it("card has data-rid attribute when review.id is set (t5)", () => {
    const section = buildReviews(makeData()) as HTMLElement;
    const card = section.querySelector(".atv-review-card") as HTMLElement;
    expect(card).not.toBeNull();
    expect(card.dataset.rid).toBe("r1");
  });

  it("avatar has background-image when avatar is provided (t6)", () => {
    const section = buildReviews(
      makeData({
        reviews: [makeReview({ avatar: "https://example.com/ava.jpg" })],
      })
    ) as HTMLElement;
    const avatar = section.querySelector(
      ".atv-review-card .atv-review-avatar"
    ) as HTMLElement;
    expect(avatar).not.toBeNull();
    expect(avatar.style.backgroundImage).toContain("example.com/ava.jpg");
  });

  it("avatar shows first letter of name when avatar is empty (t7)", () => {
    const section = buildReviews(
      makeData({
        reviews: [makeReview({ avatar: "", name: "Alice" })],
      })
    ) as HTMLElement;
    const avatar = section.querySelector(
      ".atv-review-card .atv-review-avatar"
    ) as HTMLElement;
    expect(avatar).not.toBeNull();
    expect(avatar.textContent).toBe("A");
  });

  it("author with link renders as anchor with href, rel, target (t8)", () => {
    const section = buildReviews(
      makeData({
        reviews: [
          makeReview({
            link: "https://douban.com/people/u1/",
            name: "Alice",
          }),
        ],
      })
    ) as HTMLElement;
    const author = section.querySelector(
      ".atv-review-card .atv-review-author"
    ) as HTMLElement;
    expect(author).not.toBeNull();
    expect(author.tagName).toBe("A");
    expect(author.textContent).toBe("Alice");
    expect(author.getAttribute("href")).toBe("https://douban.com/people/u1/");
    expect(author.getAttribute("rel")).toBe("noopener");
    expect(author.getAttribute("target")).toBe("_blank");
  });

  it("author without link renders as div with no href (t9)", () => {
    const section = buildReviews(
      makeData({
        reviews: [makeReview({ link: "", name: "Bob" })],
      })
    ) as HTMLElement;
    const author = section.querySelector(
      ".atv-review-card .atv-review-author"
    ) as HTMLElement;
    expect(author).not.toBeNull();
    expect(author.tagName).toBe("DIV");
    expect(author.textContent).toBe("Bob");
  });

  /* ── Title ──────────────────────────────────────────────── */

  it("card displays review title (t10)", () => {
    const section = buildReviews(
      makeData({
        reviews: [makeReview({ title: "Deep and moving" })],
      })
    ) as HTMLElement;
    const titleEl = section.querySelector(
      ".atv-review-card .atv-review-title"
    ) as HTMLElement;
    expect(titleEl).not.toBeNull();
    expect(titleEl.textContent).toBe("Deep and moving");
  });

  /* ── Excerpt ────────────────────────────────────────────── */

  it("card displays review excerpt (t11)", () => {
    const section = buildReviews(
      makeData({
        reviews: [makeReview({ content: "A must-see classic." })],
      })
    ) as HTMLElement;
    const excerpt = section.querySelector(
      ".atv-review-card .atv-review-excerpt"
    ) as HTMLElement;
    expect(excerpt).not.toBeNull();
    expect(excerpt.textContent).toBe("A must-see classic.");
  });

  /* ── Footer / time / vote buttons ────────────────────── */

  it("footer displays the review time (t12)", () => {
    const section = buildReviews(
      makeData({
        reviews: [makeReview({ time: "2024-06-01" })],
      })
    ) as HTMLElement;
    const timeEl = section.querySelector(
      ".atv-review-card .atv-review-time"
    ) as HTMLElement;
    expect(timeEl).not.toBeNull();
    expect(timeEl?.textContent).toContain("2024-06-01");
  });

  it("renders vote buttons when usefulCount/uselessCount are present (t13)", () => {
    const section = buildReviews(
      makeData({
        reviews: [makeReview({ usefulCount: 5, uselessCount: 1 })],
      })
    ) as HTMLElement;
    const upBtn = section.querySelector(
      ".atv-review-card .atv-vote-btn.up"
    ) as HTMLElement;
    const downBtn = section.querySelector(
      ".atv-review-card .atv-vote-btn.down"
    ) as HTMLElement;
    expect(upBtn).not.toBeNull();
    expect(upBtn.textContent).toContain("5");
    expect(downBtn).not.toBeNull();
    expect(downBtn.textContent).toContain("1");
  });

  it("renders vote buttons even when counts are 0 (t14)", () => {
    const section = buildReviews(
      makeData({
        reviews: [makeReview({ usefulCount: 0, uselessCount: 0 })],
      })
    ) as HTMLElement;
    const upBtn = section.querySelector(
      ".atv-review-card .atv-vote-btn.up"
    ) as HTMLElement;
    expect(upBtn).not.toBeNull();
    expect(upBtn.textContent).toContain("0");
  });

  it("renders is-voted class when localStorage has 'up' vote (t14b)", () => {
    /* createCache stores [key, {expiresAt, value}][] tuples */
    localStorage.setItem(
      "atv:review:vote",
      JSON.stringify([
        [
          "123",
          { expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, value: "up" },
        ],
      ])
    );
    const section = buildReviews(
      makeData({
        reviews: [makeReview({ id: "123", usefulCount: 5 })],
      })
    ) as HTMLElement;
    const upBtn = section.querySelector(
      ".atv-review-card .atv-vote-btn.up"
    ) as HTMLElement;
    const downBtn = section.querySelector(
      ".atv-review-card .atv-vote-btn.down"
    ) as HTMLElement;
    expect(upBtn.classList.contains("is-voted")).toBe(true);
    expect(downBtn.classList.contains("is-voted")).toBe(false);
    localStorage.removeItem("atv:review:vote");
  });

  it("renders is-voted class when localStorage has 'down' vote (t14c)", () => {
    /* createCache stores [key, {expiresAt, value}][] tuples */
    localStorage.setItem(
      "atv:review:vote",
      JSON.stringify([
        [
          "123",
          { expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, value: "down" },
        ],
      ])
    );
    const section = buildReviews(
      makeData({
        reviews: [makeReview({ id: "123", uselessCount: 3 })],
      })
    ) as HTMLElement;
    const downBtn = section.querySelector(
      ".atv-review-card .atv-vote-btn.down"
    ) as HTMLElement;
    expect(downBtn.classList.contains("is-voted")).toBe(true);
    localStorage.removeItem("atv:review:vote");
  });

  /* ── Stars ─────────────────────────────────────────────── */

  it("renders stars when review.stars > 0 (t15)", () => {
    const section = buildReviews(
      makeData({
        reviews: [makeReview({ stars: 4 })],
      })
    ) as HTMLElement;
    const stars = section.querySelector(".atv-review-card .atv-review-stars");
    expect(stars).not.toBeNull();
  });

  it("hides stars when review.stars is 0 (t16)", () => {
    const section = buildReviews(
      makeData({
        reviews: [makeReview({ stars: 0 })],
      })
    ) as HTMLElement;
    const stars = section.querySelector(".atv-review-card .atv-review-stars");
    expect(stars).toBeNull();
  });

  /* ── subjectId → moreLink ─────────────────────────────── */

  it("moreLink renders when subjectId is present (t17)", () => {
    const section = buildReviews(
      makeData({
        reviews: [makeReview({ id: "r1" })],
        subjectId: "1292052",
      })
    ) as HTMLElement;
    const link = section.querySelector(".atv-section-more") as HTMLElement;
    expect(link).not.toBeNull();
    expect(link.textContent).toBe("查看全部 →");
    expect(link.getAttribute("href")).toBe(
      "https://movie.douban.com/subject/1292052/reviews"
    );
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener");
  });

  it("moreLink omitted when subjectId is empty (t18)", () => {
    const section = buildReviews(
      makeData({
        reviews: [makeReview({ id: "r1" })],
        subjectId: "",
      })
    ) as HTMLElement;
    expect(section.querySelector(".atv-section-more")).toBeNull();
  });

  /* ── Multiple cards ─────────────────────────────────────── */

  it("renders correct number of cards for multiple reviews (t19)", () => {
    const section = buildReviews(
      makeData({
        reviews: [
          makeReview({ id: "r1" }),
          makeReview({ id: "r2" }),
          makeReview({ id: "r3" }),
        ],
      })
    ) as HTMLElement;
    const cards = section.querySelectorAll(".atv-review-card");
    expect(cards.length).toBe(3);
  });

  /* ── Click → modal (not window.open) ────────────────────── */

  it("clicking a card opens modal — does not call window.open (t20)", () => {
    /* Simulate the hidden native DOM: a review-item with matching id */
    const nativeItem = document.createElement("div");
    nativeItem.className = "review-item";
    nativeItem.id = "r1";
    nativeItem.innerHTML =
      '<div id="review_1_full"><div class="review-content"><p>Full content.</p></div></div><div class="action"><a class="action-btn up" data-rid="r1">5</a><a class="action-btn down" data-rid="r1">1</a></div>';
    document.body.append(nativeItem);

    /* Mock requestAnimationFrame so createOverlay mounts synchronously */
    const origRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = mockRaf;

    const openSpy = vi.fn();
    const origOpen = window.open;
    window.open = openSpy;

    try {
      const section = buildReviews(
        makeData({
          reviews: [makeReview({ id: "r1", title: "Title" })],
        })
      ) as HTMLElement;
      const card = section.querySelector(".atv-review-card") as HTMLElement;
      expect(card).not.toBeNull();

      card.click();

      /* window.open should NOT have been called — modal should be used instead */
      expect(openSpy).not.toHaveBeenCalled();

      /* Modal should appear in the DOM */
      const modal = document.querySelector("#atv-review-modal");
      expect(modal).not.toBeNull();
    } finally {
      nativeItem.remove();
      window.requestAnimationFrame = origRaf;
      window.open = origOpen;
      document.querySelector("#atv-review-modal")?.remove();
    }
  });

  it("handles numeric review IDs without SyntaxError (t21)", () => {
    /* Real Douban review IDs are numeric like "17189613" — must not throw */
    const nativeItem = document.createElement("div");
    nativeItem.className = "review-item";
    nativeItem.id = "17189613";
    nativeItem.innerHTML =
      '<div id="review_17189613_full"><div class="review-content"><p>Content.</p></div></div>';
    document.body.append(nativeItem);

    const origRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = mockRaf;

    try {
      const section = buildReviews(
        makeData({
          reviews: [makeReview({ id: "17189613", title: "Num ID" })],
        })
      ) as HTMLElement;
      const card = section.querySelector(".atv-review-card") as HTMLElement;
      expect(card).not.toBeNull();

      /* Must not throw */
      expect(() => card.click()).not.toThrow();

      const modal = document.querySelector("#atv-review-modal");
      expect(modal).not.toBeNull();
    } finally {
      nativeItem.remove();
      window.requestAnimationFrame = origRaf;
      document.querySelector("#atv-review-modal")?.remove();
    }
  });

  it("buttons move to modal and back to card on close (t22)", () => {
    const nativeItem = document.createElement("div");
    nativeItem.className = "review-item";
    nativeItem.id = "r1";
    nativeItem.innerHTML =
      '<div id="review_1_full"><div class="review-content"><p>Full.</p></div></div><div class="action"><a class="action-btn up" data-rid="r1">5</a><a class="action-btn down" data-rid="r1">1</a></div>';
    document.body.append(nativeItem);

    const origRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = mockRaf;

    try {
      const section = buildReviews(
        makeData({
          reviews: [makeReview({ id: "r1", usefulCount: 5, uselessCount: 1 })],
        })
      ) as HTMLElement;
      const card = section.querySelector(".atv-review-card") as HTMLElement;
      const upBtn = card.querySelector(".atv-vote-btn.up");

      card.click();
      const modal = document.querySelector("#atv-review-modal");
      expect(modal).not.toBeNull();

      expect(card.querySelector(".atv-vote-btn.up")).toBeNull();
      const modalUpBtn = modal?.querySelector(".atv-vote-btn.up");
      expect(modalUpBtn).not.toBeNull();
      expect(modalUpBtn).toBe(upBtn);

      const closeBtn = modal?.querySelector(".atv-modal-close") as HTMLElement;
      closeBtn.click();

      expect(card.querySelector(".atv-vote-btn.up")).toBe(upBtn);
      expect(
        document.querySelector("#atv-review-modal .atv-vote-btn.up")
      ).toBeNull();
    } finally {
      nativeItem.remove();
      window.requestAnimationFrame = origRaf;
      document.querySelector("#atv-review-modal")?.remove();
    }
  });

  it("vote in card → modal shows same state — count + is-voted (t23)", async () => {
    const nativeItem = document.createElement("div");
    nativeItem.className = "review-item";
    nativeItem.id = "r1";
    nativeItem.innerHTML =
      '<div id="review_1_full"><div class="review-content"><p>Full.</p></div></div><div class="action"><a class="action-btn up" data-rid="r1">5</a><a class="action-btn down" data-rid="r1">1</a></div>';
    document.body.append(nativeItem);

    const origRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = mockRaf;

    const mockVote = vi
      .fn()
      .mockResolvedValue({ ok: true, usefulCount: 6, uselessCount: 1 });

    try {
      const section = buildReviews(
        makeData({
          onReviewVote: mockVote,
          reviews: [makeReview({ id: "r1", usefulCount: 5, uselessCount: 1 })],
        })
      ) as HTMLElement;
      const card = section.querySelector(".atv-review-card") as HTMLElement;
      const upBtn = card.querySelector(".atv-vote-btn.up") as HTMLButtonElement;

      upBtn.click();
      await vi.waitFor(() => {
        expect(upBtn.textContent).toContain("6");
        expect(upBtn.classList.contains("is-voted")).toBe(true);
      });

      card.click();
      const modal = document.querySelector("#atv-review-modal") as HTMLElement;
      expect(modal).not.toBeNull();

      const modalUpBtn = modal.querySelector(
        ".atv-vote-btn.up"
      ) as HTMLButtonElement;
      expect(modalUpBtn).toBe(upBtn);
      expect(modalUpBtn.textContent).toContain("6");
      expect(modalUpBtn.classList.contains("is-voted")).toBe(true);
    } finally {
      nativeItem.remove();
      window.requestAnimationFrame = origRaf;
      document.querySelector("#atv-review-modal")?.remove();
      localStorage.removeItem("atv:review:vote");
    }
  });

  it("vote in modal → close → card shows same state (t24)", async () => {
    localStorage.removeItem("atv:review:vote");
    const nativeItem = document.createElement("div");
    nativeItem.className = "review-item";
    nativeItem.id = "r1";
    nativeItem.innerHTML =
      '<div id="review_1_full"><div class="review-content"><p>Full.</p></div></div><div class="action"><a class="action-btn up" data-rid="r1">5</a><a class="action-btn down" data-rid="r1">1</a></div>';
    document.body.append(nativeItem);

    const origRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = mockRaf;

    const mockVote = vi
      .fn()
      .mockResolvedValue({ ok: true, usefulCount: 6, uselessCount: 1 });

    try {
      const section = buildReviews(
        makeData({
          onReviewVote: mockVote,
          reviews: [makeReview({ id: "r1", usefulCount: 5, uselessCount: 1 })],
        })
      ) as HTMLElement;
      const card = section.querySelector(".atv-review-card") as HTMLElement;
      const upBtnBefore = card.querySelector(
        ".atv-vote-btn.up"
      ) as HTMLButtonElement;

      card.click();
      const modal = document.querySelector("#atv-review-modal") as HTMLElement;
      const modalUpBtn = modal.querySelector(
        ".atv-vote-btn.up"
      ) as HTMLButtonElement;

      modalUpBtn.click();
      await vi.waitFor(() => {
        expect(modalUpBtn.textContent).toContain("6");
        expect(modalUpBtn.classList.contains("is-voted")).toBe(true);
      });

      const closeBtn = modal.querySelector(".atv-modal-close") as HTMLElement;
      closeBtn.click();

      const cardUpBtnAfter = card.querySelector(
        ".atv-vote-btn.up"
      ) as HTMLButtonElement;
      expect(cardUpBtnAfter).toBe(upBtnBefore);
      expect(cardUpBtnAfter.textContent).toContain("6");
      expect(cardUpBtnAfter.classList.contains("is-voted")).toBe(true);
    } finally {
      nativeItem.remove();
      window.requestAnimationFrame = origRaf;
      document.querySelector("#atv-review-modal")?.remove();
    }
  });

  it("renders stars in modal header when review.stars > 0 (t25)", () => {
    const nativeItem = appendNativeReview("r1");
    const origRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = mockRaf;

    try {
      const modal = openModalForReview(
        makeReview({ id: "r1", stars: 4, title: "With stars" })
      );
      const stars = modal.querySelector(".atv-review-modal-stars");
      expect(stars).not.toBeNull();
      expect(stars?.querySelectorAll("svg").length).toBe(5);
    } finally {
      nativeItem.remove();
      window.requestAnimationFrame = origRaf;
      document.querySelector("#atv-review-modal")?.remove();
    }
  });

  it("hides stars in modal header when review.stars is 0 (t26)", () => {
    const nativeItem = appendNativeReview("r1");
    const origRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = mockRaf;

    try {
      const modal = openModalForReview(
        makeReview({ id: "r1", stars: 0, title: "No stars" })
      );
      expect(modal.querySelector(".atv-review-modal-stars")).toBeNull();
    } finally {
      nativeItem.remove();
      window.requestAnimationFrame = origRaf;
      document.querySelector("#atv-review-modal")?.remove();
    }
  });

  it("review modal exposes dialog semantics and reading structure (t27)", () => {
    const nativeItem = appendNativeReview("r1", "<p>Readable full text.</p>");
    const origRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = mockRaf;

    try {
      const modal = openModalForReview(
        makeReview({
          id: "r1",
          name: "Reader",
          stars: 5,
          time: "2026-07-07",
          title: "A long review",
          usefulCount: 7,
          uselessCount: 1,
        })
      );
      const title = modal.querySelector("#atv-review-modal-title");
      expect(modal.getAttribute("role")).toBe("dialog");
      expect(modal.getAttribute("aria-modal")).toBe("true");
      expect(modal.getAttribute("aria-labelledby")).toBe(
        "atv-review-modal-title"
      );
      expect(title?.textContent).toBe("A long review");
      expect(modal.querySelector(".atv-review-modal-author")?.textContent).toBe(
        "Reader · 2026-07-07"
      );
      expect(modal.querySelector(".atv-review-modal-body")?.textContent).toBe(
        "Readable full text."
      );
      expect(modal.querySelector(".atv-review-modal-votes")).not.toBeNull();
      expect(modal.querySelector(".atv-review-modal-link-a")).not.toBeNull();
      expect(
        modal.querySelector(".atv-modal-close")?.getAttribute("aria-label")
      ).toBe("关闭影评");
    } finally {
      nativeItem.remove();
      window.requestAnimationFrame = origRaf;
      document.querySelector("#atv-review-modal")?.remove();
    }
  });

  it("shows skeleton while async review content is unresolved (t28)", () => {
    const nativeItem = document.createElement("div");
    nativeItem.className = "review-item";
    nativeItem.id = "r1";
    document.body.append(nativeItem);
    const origRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = mockRaf;
    const fetchDeferred = Promise.withResolvers<Response>();
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(fetchDeferred.promise));

    try {
      const modal = openModalForReview(makeReview({ id: "r1" }));
      const body = modal.querySelector(".atv-review-modal-body") as HTMLElement;
      expect(body.classList.contains("is-skeleton")).toBe(true);
      expect(body.getAttribute("aria-busy")).toBe("true");
    } finally {
      nativeItem.remove();
      window.requestAnimationFrame = origRaf;
      vi.unstubAllGlobals();
      document.querySelector("#atv-review-modal")?.remove();
    }
  });

  it("replaces skeleton with fetched review content (t29)", async () => {
    const nativeItem = document.createElement("div");
    nativeItem.className = "review-item";
    nativeItem.id = "r1";
    document.body.append(nativeItem);
    const origRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = mockRaf;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(
            '<div class="review-content"><p style="color:red">Fetched text<a class="unfold">展开</a><span class="short-content">Short</span></p></div>'
          ),
      })
    );

    try {
      const modal = openModalForReview(makeReview({ id: "r1" }));
      const body = modal.querySelector(".atv-review-modal-body") as HTMLElement;
      await vi.waitFor(() => {
        expect(body.classList.contains("is-skeleton")).toBe(false);
        expect(body.textContent).toBe("Fetched text");
      });
      expect(body.getAttribute("aria-busy")).toBe("false");
      expect(body.innerHTML).not.toContain("style=");
    } finally {
      nativeItem.remove();
      window.requestAnimationFrame = origRaf;
      vi.unstubAllGlobals();
      document.querySelector("#atv-review-modal")?.remove();
    }
  });

  it("shows error state and retries failed review fetches (t30)", async () => {
    const nativeItem = document.createElement("div");
    nativeItem.className = "review-item";
    nativeItem.id = "r1";
    document.body.append(nativeItem);
    const origRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = mockRaf;
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(
            '<div class="review-content"><p>Recovered content</p></div>'
          ),
      });
    vi.stubGlobal("fetch", fetchMock);

    try {
      const modal = openModalForReview(makeReview({ id: "r1" }));
      const body = modal.querySelector(".atv-review-modal-body") as HTMLElement;
      await vi.waitFor(() => {
        expect(body.classList.contains("is-error")).toBe(true);
      });
      expect(body.textContent).toContain("影评内容暂时加载失败");

      const retry = body.querySelector(
        ".atv-review-modal-retry"
      ) as HTMLButtonElement;
      retry.click();

      await vi.waitFor(() => {
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(body.textContent).toBe("Recovered content");
      });
      expect(body.classList.contains("is-error")).toBe(false);
    } finally {
      nativeItem.remove();
      window.requestAnimationFrame = origRaf;
      vi.unstubAllGlobals();
      document.querySelector("#atv-review-modal")?.remove();
    }
  });

  it("does not update review content after modal closes (t31)", async () => {
    const nativeItem = document.createElement("div");
    nativeItem.className = "review-item";
    nativeItem.id = "r1";
    document.body.append(nativeItem);
    const origRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = mockRaf;
    const textDeferred = Promise.withResolvers<string>();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => textDeferred.promise,
      })
    );

    try {
      const modal = openModalForReview(makeReview({ id: "r1" }));
      const body = modal.querySelector(".atv-review-modal-body") as HTMLElement;
      const closeBtn = modal.querySelector(".atv-modal-close") as HTMLElement;

      closeBtn.click();
      textDeferred.resolve('<div class="review-content"><p>Too late</p></div>');
      await Promise.resolve();
      await Promise.resolve();

      expect(body.classList.contains("is-skeleton")).toBe(true);
      expect(body.textContent).toBe("加载中");
    } finally {
      nativeItem.remove();
      window.requestAnimationFrame = origRaf;
      vi.unstubAllGlobals();
      document.querySelector("#atv-review-modal")?.remove();
    }
  });
});
