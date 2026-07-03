/* ── modal — openPosterModal(), openVideoModal() Tests ─────── */
/* Tests the modal overlay components for poster and video.     */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { openPosterModal, openVideoModal } from "../../src/components/modal";
import type { Trailer } from "../../src/types";

const stubRaf = (): void => {
  vi.spyOn(window, "requestAnimationFrame").mockImplementation(
    // oxlint-disable-next-line promise/prefer-await-to-callbacks
    (cb: FrameRequestCallback): number => {
      // oxlint-disable-next-line promise/prefer-await-to-callbacks
      cb(0);
      return 0;
    }
  );
};

const TRAILER: Trailer = {
  thumbUrl: "https://img.example.com/thumb.jpg",
  title: "\u9884\u544A\u7247",
  trailerPageUrl: "https://movie.douban.com/trailer/123456/",
};

const EMBED_URL = "https://media.douban.com/video.mp4";

const LD_JSON = JSON.stringify({ embedUrl: EMBED_URL });

const SUCCESS_HTML = `<html><head><script type="application/ld+json">${LD_JSON}</script></head></html>`;

const cleanupDom = (): void => {
  for (const el of document.querySelectorAll<HTMLElement>(
    ".atv-modal-overlay, #atv-vs"
  )) {
    el.remove();
  }
  document.body.style.overflow = "";
};

/* ── openPosterModal(src, alt) ──────────────────────────── */

describe("openPosterModal(src, alt)", () => {
  beforeEach(() => {
    stubRaf();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanupDom();
  });

  /* ── DOM structure ── */

  it("creates overlay with correct id and class", () => {
    openPosterModal("https://img.example.com/poster.jpg", "Alt Text");
    const overlay = document.querySelector("#atv-poster-modal");
    expect(overlay).not.toBeNull();
    expect(overlay?.className).toContain("atv-modal-overlay");
  });

  it("creates img element with correct src and alt", () => {
    openPosterModal("https://img.example.com/poster.jpg", "Alt Text");
    const img = document.querySelector<HTMLImageElement>(
      "#atv-poster-modal .atv-modal-img"
    );
    expect(img).not.toBeNull();
    expect(img?.src).toBe("https://img.example.com/poster.jpg");
    expect(img?.alt).toBe("Alt Text");
  });

  it("replaces existing poster modal on second call", () => {
    openPosterModal("https://img.example.com/first.jpg", "First");
    const first = document.querySelector("#atv-poster-modal");
    openPosterModal("https://img.example.com/second.jpg", "Second");
    expect(document.body.contains(first)).toBe(false);
    const img = document.querySelector<HTMLImageElement>(
      "#atv-poster-modal .atv-modal-img"
    );
    expect(img?.src).toBe("https://img.example.com/second.jpg");
  });

  it("handles empty alt string", () => {
    openPosterModal("https://img.example.com/poster.jpg", "");
    const img = document.querySelector<HTMLImageElement>(
      "#atv-poster-modal .atv-modal-img"
    );
    expect(img?.alt).toBe("");
  });

  it("creates close button with SVG icon", () => {
    openPosterModal("https://img.example.com/poster.jpg", "Alt");
    const closeBtn = document.querySelector<HTMLButtonElement>(
      "#atv-poster-modal .atv-modal-close"
    );
    expect(closeBtn).not.toBeNull();
    expect(closeBtn?.querySelector("svg")).not.toBeNull();
  });

  /* ── Behavior ── */

  it("sets body overflow hidden", () => {
    openPosterModal("https://img.example.com/poster.jpg", "Test");
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("adds is-open class via requestAnimationFrame", () => {
    openPosterModal("https://img.example.com/poster.jpg", "Test");
    const overlay = document.querySelector("#atv-poster-modal");
    expect(overlay?.classList.contains("is-open")).toBe(true);
  });

  it("removes is-open class and restores overflow on close button click", () => {
    openPosterModal("https://img.example.com/poster.jpg", "Test");
    const closeBtn = document.querySelector<HTMLButtonElement>(
      "#atv-poster-modal .atv-modal-close"
    );
    closeBtn?.click();
    const overlay = document.querySelector("#atv-poster-modal") as HTMLElement;
    expect(overlay.classList.contains("is-open")).toBe(false);
    expect(document.body.style.overflow).toBe("");
  });

  it("removes is-open class and restores overflow on click outside", () => {
    openPosterModal("https://img.example.com/poster.jpg", "Test");
    const overlay = document.querySelector("#atv-poster-modal") as HTMLElement;
    overlay.click();
    expect(overlay.classList.contains("is-open")).toBe(false);
    expect(document.body.style.overflow).toBe("");
  });

  it("dismisses via close button and removes overlay after 350ms", () => {
    vi.useFakeTimers();
    stubRaf();
    openPosterModal("https://img.example.com/poster.jpg", "Test");
    const closeBtn = document.querySelector<HTMLButtonElement>(
      "#atv-poster-modal .atv-modal-close"
    );
    closeBtn?.click();
    vi.advanceTimersByTime(350);
    expect(document.querySelector("#atv-poster-modal")).toBeNull();
    vi.useRealTimers();
  });

  it("dismisses via Escape and removes overlay after 350ms", () => {
    vi.useFakeTimers();
    stubRaf();
    openPosterModal("https://img.example.com/poster.jpg", "Test");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    vi.advanceTimersByTime(350);
    expect(document.querySelector("#atv-poster-modal")).toBeNull();
    vi.useRealTimers();
  });

  it("dismisses via click outside and removes overlay after 350ms", () => {
    vi.useFakeTimers();
    stubRaf();
    openPosterModal("https://img.example.com/poster.jpg", "Test");
    (document.querySelector("#atv-poster-modal") as HTMLElement).click();
    vi.advanceTimersByTime(350);
    expect(document.querySelector("#atv-poster-modal")).toBeNull();
    vi.useRealTimers();
  });
});

/* ── openVideoModal(trailer) ─────────────────────────────── */

describe("openVideoModal(trailer)", () => {
  beforeEach(() => {
    stubRaf();
    vi.spyOn(window, "open").mockImplementation(() => null);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(SUCCESS_HTML, { status: 200 })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanupDom();
  });

  /* ── DOM structure ── */

  it("creates overlay with correct id and class", () => {
    openVideoModal(TRAILER);
    const overlay = document.querySelector("#atv-video-modal");
    expect(overlay).not.toBeNull();
    expect(overlay?.className).toContain("atv-modal-overlay");
    expect(overlay?.className).toContain("is-video");
  });

  it("injects style element for spinner animations", () => {
    openVideoModal(TRAILER);
    const style = document.querySelector("#atv-vs");
    expect(style).not.toBeNull();
    expect(style instanceof HTMLStyleElement).toBe(true);
  });

  it("injects style only once across multiple calls", () => {
    openVideoModal(TRAILER);
    openVideoModal(TRAILER);
    const styles = document.querySelectorAll("#atv-vs");
    expect(styles.length).toBe(1);
  });

  it("replaces existing video modal on second call", () => {
    openVideoModal(TRAILER);
    const first = document.querySelector("#atv-video-modal");
    openVideoModal(TRAILER);
    expect(document.body.contains(first)).toBe(false);
  });

  it("shows loading indicator initially", () => {
    openVideoModal(TRAILER);
    const loading = document.querySelector(
      "#atv-video-modal .atv-modal-loading"
    );
    expect(loading).not.toBeNull();
    expect(loading?.textContent).toContain("\u52A0\u8F7D\u4E2D...");
  });

  it("creates close button with SVG icon", () => {
    openVideoModal(TRAILER);
    const closeBtn = document.querySelector<HTMLButtonElement>(
      "#atv-video-modal .atv-modal-close"
    );
    expect(closeBtn).not.toBeNull();
    expect(closeBtn?.querySelector("svg")).not.toBeNull();
  });

  /* ── Behavior ── */

  it("sets body overflow hidden on open", () => {
    openVideoModal(TRAILER);
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("adds is-open class via requestAnimationFrame", () => {
    openVideoModal(TRAILER);
    const overlay = document.querySelector("#atv-video-modal");
    expect(overlay?.classList.contains("is-open")).toBe(true);
  });

  it("removes is-open class and restores overflow on close button click", () => {
    openVideoModal(TRAILER);
    const closeBtn = document.querySelector<HTMLButtonElement>(
      "#atv-video-modal .atv-modal-close"
    );
    closeBtn?.click();
    const overlay = document.querySelector("#atv-video-modal") as HTMLElement;
    expect(overlay.classList.contains("is-open")).toBe(false);
    expect(document.body.style.overflow).toBe("");
  });

  it("dismisses via close button and removes after 350ms", () => {
    vi.useFakeTimers();
    stubRaf();
    vi.spyOn(window, "open").mockImplementation(() => null);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(SUCCESS_HTML, { status: 200 })
    );
    openVideoModal(TRAILER);
    const closeBtn = document.querySelector<HTMLButtonElement>(
      "#atv-video-modal .atv-modal-close"
    );
    closeBtn?.click();
    vi.advanceTimersByTime(350);
    expect(document.querySelector("#atv-video-modal")).toBeNull();
    vi.useRealTimers();
  });

  it("dismisses via Escape key and removes after 350ms", () => {
    vi.useFakeTimers();
    stubRaf();
    vi.spyOn(window, "open").mockImplementation(() => null);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(SUCCESS_HTML, { status: 200 })
    );
    openVideoModal(TRAILER);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    vi.advanceTimersByTime(350);
    expect(document.querySelector("#atv-video-modal")).toBeNull();
    vi.useRealTimers();
  });

  it("dismisses via click outside and removes after 350ms", () => {
    vi.useFakeTimers();
    stubRaf();
    vi.spyOn(window, "open").mockImplementation(() => null);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(SUCCESS_HTML, { status: 200 })
    );
    openVideoModal(TRAILER);
    (document.querySelector("#atv-video-modal") as HTMLElement).click();
    vi.advanceTimersByTime(350);
    expect(document.querySelector("#atv-video-modal")).toBeNull();
    vi.useRealTimers();
  });

  /* ── Async loading ── */

  it("creates video element on successful fetch", async () => {
    openVideoModal(TRAILER);
    await vi.waitFor(() => {
      const video = document.querySelector<HTMLVideoElement>(
        "#atv-video-modal .atv-modal-video"
      );
      expect(video).not.toBeNull();
      expect(video?.src).toBe(EMBED_URL);
    });
    expect(
      document.querySelector("#atv-video-modal .atv-modal-loading")
    ).toBeNull();
  });

  it("shows error toast and redirects on fetch failure", async () => {
    vi.restoreAllMocks();
    stubRaf();
    vi.spyOn(window, "open").mockImplementation(() => null);
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));
    vi.useFakeTimers();
    openVideoModal(TRAILER);
    await vi.waitFor(() => {
      const toast = document.querySelector(".atv-modal-toast");
      expect(toast).not.toBeNull();
      expect(toast?.textContent).toBe("\u89C6\u9891\u52A0\u8F7D\u5931\u8D25");
    });
    vi.advanceTimersByTime(2000);
    expect(window.open).toHaveBeenCalledWith(TRAILER.trailerPageUrl, "_blank");
    expect(document.querySelector("#atv-video-modal")).toBeNull();
    vi.useRealTimers();
  });

  it("auto-removes error toast after 3 seconds", async () => {
    vi.restoreAllMocks();
    stubRaf();
    vi.spyOn(window, "open").mockImplementation(() => null);
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("fail"));
    vi.useFakeTimers();
    openVideoModal(TRAILER);
    await vi.waitFor(() => {
      expect(document.querySelector(".atv-modal-toast")).not.toBeNull();
    });
    vi.advanceTimersByTime(3000);
    expect(document.querySelector(".atv-modal-toast")).toBeNull();
    vi.useRealTimers();
  });

  it("does not create video if overlay dismissed before fetch completes", async () => {
    let resolveFetch!: (value: Response) => void;
    // oxlint-disable-next-line promise/avoid-new
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    vi.restoreAllMocks();
    stubRaf();
    vi.spyOn(window, "open").mockImplementation(() => null);
    vi.spyOn(globalThis, "fetch").mockReturnValue(fetchPromise);
    vi.useFakeTimers();
    openVideoModal(TRAILER);
    const closeBtn = document.querySelector<HTMLButtonElement>(
      "#atv-video-modal .atv-modal-close"
    );
    closeBtn?.click();
    vi.advanceTimersByTime(350);
    resolveFetch(new Response(SUCCESS_HTML, { status: 200 }));
    await vi.waitFor(() => {
      expect(document.querySelector(".atv-modal-video")).toBeNull();
    });
    vi.useRealTimers();
  });

  it("handles ld+json without embedUrl as error", async () => {
    const noEmbedHtml = `<html><head><script type="application/ld+json">{"title":"No Video"}</script></head></html>`;
    vi.restoreAllMocks();
    stubRaf();
    vi.spyOn(window, "open").mockImplementation(() => null);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(noEmbedHtml, { status: 200 })
    );
    vi.useFakeTimers();
    openVideoModal(TRAILER);
    await vi.waitFor(() => {
      expect(document.querySelector(".atv-modal-toast")).not.toBeNull();
    });
    vi.advanceTimersByTime(2000);
    expect(window.open).toHaveBeenCalled();
    expect(document.querySelector("#atv-video-modal")).toBeNull();
    vi.useRealTimers();
  });
});
