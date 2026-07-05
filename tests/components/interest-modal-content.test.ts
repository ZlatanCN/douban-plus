/* ── interest-modal-content — Builder + Star Tests ────── */
/* Tests the pure DOM builder and star mini-component.     */

import { describe, it, expect } from "vitest";

import {
  buildInterestModalContent,
  buildStarRating,
} from "../../src/components/interest-modal-content";
import type { InterestState } from "../../src/types";

/* ── Mock state factory ───────────────────────────────── */

const makeState = (overrides?: Partial<InterestState>): InterestState => ({
  ck: "",
  comment: "",
  date: "",
  hasWatching: false,
  loggedIn: true,
  marked: false,
  rating: 0,
  status: "none",
  tags: [],
  usefulCount: "",
  ...overrides,
});

/* ── buildStarRating ──────────────────────────────────── */

describe("buildStarRating", () => {
  it("returns a container with 5 star elements", () => {
    const sr = buildStarRating(0);
    expect(sr.container instanceof HTMLDivElement).toBe(true);
    expect(sr.container.children).toHaveLength(5);
  });

  it("initial rating=3 renders 3 full, 2 empty stars", () => {
    const sr = buildStarRating(3);
    const stars = sr.container.children;
    for (let i = 0; i < 3; i += 1) {
      expect(stars[i].classList.contains("is-full")).toBe(true);
    }
    for (let i = 3; i < 5; i += 1) {
      expect(stars[i].classList.contains("is-full")).toBe(false);
    }
  });

  it("setRating(2) updates display to 2 full", () => {
    const sr = buildStarRating(0);
    sr.setRating(2);
    const stars = sr.container.children;
    for (let i = 0; i < 2; i += 1) {
      expect(stars[i].classList.contains("is-full")).toBe(true);
    }
    for (let i = 2; i < 5; i += 1) {
      expect(stars[i].classList.contains("is-full")).toBe(false);
    }
  });

  it("currentRating() returns the committed rating", () => {
    const sr = buildStarRating(4);
    expect(sr.currentRating()).toBe(4);
    sr.setRating(2);
    expect(sr.currentRating()).toBe(2);
  });

  it("click sets rating and updates display", () => {
    const sr = buildStarRating(0);
    const thirdStar = sr.container.children[2] as HTMLElement;
    thirdStar.click();
    expect(sr.currentRating()).toBe(3);
    for (let i = 0; i < 3; i += 1) {
      expect(sr.container.children[i].classList.contains("is-full")).toBe(true);
    }
  });

  it("mouseenter previews stars, mouseleave resets", () => {
    const sr = buildStarRating(2);
    const fourthStar = sr.container.children[3] as HTMLElement;

    // Hover over 4th star → preview shows 4 full
    fourthStar.dispatchEvent(new MouseEvent("mouseenter"));
    for (let i = 0; i < 4; i += 1) {
      expect(sr.container.children[i].classList.contains("is-full")).toBe(true);
    }
    expect(sr.container.children[4].classList.contains("is-full")).toBe(false);

    // Mouse leave → resets to current rating (2)
    sr.container.dispatchEvent(new MouseEvent("mouseleave"));
    for (let i = 0; i < 2; i += 1) {
      expect(sr.container.children[i].classList.contains("is-full")).toBe(true);
    }
    for (let i = 2; i < 5; i += 1) {
      expect(sr.container.children[i].classList.contains("is-full")).toBe(
        false
      );
    }
  });

  it("setIsLoading(true) prevents click from changing rating", () => {
    const sr = buildStarRating(1);
    sr.setIsLoading(true);
    const thirdStar = sr.container.children[2] as HTMLElement;
    thirdStar.click();
    expect(sr.currentRating()).toBe(1);
  });

  it("setIsLoading(false) re-enables clicks", () => {
    const sr = buildStarRating(0);
    sr.setIsLoading(true);

    const secondStar = sr.container.children[1] as HTMLElement;
    secondStar.click();
    expect(sr.currentRating()).toBe(0);

    sr.setIsLoading(false);
    secondStar.click();
    expect(sr.currentRating()).toBe(2);
  });
});

/* ── buildInterestModalContent ────────────────────────── */

describe("buildInterestModalContent", () => {
  it("returns an overlay with id=atv-interest-modal", () => {
    const c = buildInterestModalContent(makeState());
    expect(c.overlay.id).toBe("atv-interest-modal");
  });

  it("includes close button, title, status buttons, stars, textarea, submit", () => {
    const c = buildInterestModalContent(makeState());
    expect(c.closeBtn instanceof HTMLButtonElement).toBe(true);
    expect(c.titleSpan instanceof HTMLSpanElement).toBe(true);
    expect(c.statusBtns.length).toBeGreaterThan(0);
    expect(c.starRating.container instanceof HTMLDivElement).toBe(true);
    expect(c.commentTextarea instanceof HTMLTextAreaElement).toBe(true);
    expect(c.submitBtn instanceof HTMLButtonElement).toBe(true);
    expect(c.errorEl instanceof HTMLDivElement).toBe(true);
  });

  it("removeBtn is null when marked=false", () => {
    const c = buildInterestModalContent(makeState({ marked: false }));
    expect(c.removeBtn).toBeNull();
  });

  it("removeBtn is present when marked=true", () => {
    const c = buildInterestModalContent(
      makeState({ marked: true, status: "wish" })
    );
    expect(c.removeBtn instanceof HTMLButtonElement).toBe(true);
  });

  it("title shows '标记想看' for unmarked state", () => {
    const c = buildInterestModalContent(makeState({ marked: false }));
    expect(c.titleSpan.textContent).toBe("标记想看");
  });

  it("title shows '修改...' for marked state", () => {
    const c = buildInterestModalContent(
      makeState({ marked: true, status: "collect" })
    );
    expect(c.titleSpan.textContent).toBe("修改看过");
  });

  it("status buttons have correct data-value attributes", () => {
    const c = buildInterestModalContent(makeState());
    for (const btn of c.statusBtns) {
      expect(["wish", "do", "collect"]).toContain(btn.dataset.value);
    }
  });

  it("status includes '在看' when hasWatching=true", () => {
    const c = buildInterestModalContent(makeState({ hasWatching: true }));
    const labels = c.statusBtns.map((b) => b.textContent);
    expect(labels).toContain("在看");
  });

  it("initStatus is from state.status when marked", () => {
    const c = buildInterestModalContent(
      makeState({ marked: true, status: "collect" })
    );
    expect(c.form.status).toBe("collect");
  });

  it("initStatus is 'wish' when not marked", () => {
    const c = buildInterestModalContent(makeState({ marked: false }));
    expect(c.form.status).toBe("wish");
  });

  it("overlay is in the assembled DOM tree", () => {
    const c = buildInterestModalContent(makeState());
    expect(
      c.overlay.querySelector(".atv-interest-modal-header")
    ).not.toBeNull();
    expect(c.overlay.querySelector(".atv-interest-modal-body")).not.toBeNull();
  });

  it("textarea reflects state.comment", () => {
    const c = buildInterestModalContent(makeState({ comment: "还不错" }));
    expect(c.commentTextarea.value).toBe("还不错");
  });
});
