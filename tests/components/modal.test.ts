/* ── modal — openPosterModal(), openVideoModal() Tests ─────── */

import { readFileSync } from "node:fs";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { openPosterModal, openVideoModal } from "@/components/modal";
import type { Trailer } from "@/types";

const MODAL_TRANSITION_MS = 400;
const modalCss = readFileSync(
  path.resolve(process.cwd(), "src/styles/modals.css"),
  "utf-8"
);

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

const waitForOpenModal = async (selector: string): Promise<HTMLElement> => {
  await vi.waitFor(() => {
    const modal = document.querySelector<HTMLElement>(selector);
    expect(modal).not.toBeNull();
    expect(modal?.classList.contains("is-open")).toBeTruthy();
    expect(document.body.style.overflow).toBe("hidden");
  });
  return document.querySelector<HTMLElement>(selector) as HTMLElement;
};

const closeTransition = (): void => {
  vi.advanceTimersByTime(MODAL_TRANSITION_MS);
};

const TRAILER: Trailer = {
  thumbUrl: "https://img.example.com/thumb.jpg",
  title: "\u9884\u544A\u7247",
  trailerPageUrl: "https://movie.douban.com/trailer/123456/",
};

const EMBED_URL = "https://media.douban.com/video.mp4";
const SUCCESS_HTML = `<html><head><script type="application/ld+json">${JSON.stringify(
  {
    embedUrl: EMBED_URL,
  }
)}</script></head></html>`;

const cleanupDom = (): void => {
  document.body.replaceChildren();
  document.querySelector("#atv-vs")?.remove();
  document.body.style.overflow = "";
};

describe("modal stylesheet", () => {
  it("resets dialog UA chrome and uses a viewport-sized backdrop", () => {
    const overlayRule = modalCss.match(
      /\.atv-modal-overlay\s*\{(?<body>[^}]*)\}/u
    )?.groups?.body;

    expect(overlayRule).toContain("width: 100vw");
    expect(overlayRule).toContain("height: 100vh");
    expect(overlayRule).toContain("margin: 0");
    expect(overlayRule).toContain("padding: 0");
    expect(overlayRule).toContain("border: none");
  });
});

describe("openPosterModal(src, alt)", () => {
  beforeEach(() => {
    stubRaf();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    cleanupDom();
  });

  it("creates a labelled ModalShell overlay", () => {
    openPosterModal("https://img.example.com/poster.jpg", "Alt Text");

    const modal = document.querySelector("#atv-poster-modal");
    expect(modal).not.toBeNull();
    expect(modal?.className).toContain("atv-modal-overlay");
    expect(modal?.getAttribute("aria-modal")).toBe("true");
    expect(modal?.getAttribute("aria-label")).toBe("海报预览");
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

    const img = document.querySelector<HTMLImageElement>(
      "#atv-poster-modal .atv-modal-img"
    );
    expect(document.body.contains(first)).toBeFalsy();
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

  it("opens with body scroll locked", async () => {
    openPosterModal("https://img.example.com/poster.jpg", "Test");

    const modal = await waitForOpenModal("#atv-poster-modal");
    expect(modal.id).toBe("atv-poster-modal");
  });

  it("dismisses via close button after the ModalShell transition", async () => {
    vi.useFakeTimers();
    openPosterModal("https://img.example.com/poster.jpg", "Test");
    await waitForOpenModal("#atv-poster-modal");

    document
      .querySelector<HTMLButtonElement>("#atv-poster-modal .atv-modal-close")
      ?.click();
    closeTransition();

    expect(document.querySelector("#atv-poster-modal")).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });

  it("dismisses via Escape after the ModalShell transition", async () => {
    vi.useFakeTimers();
    openPosterModal("https://img.example.com/poster.jpg", "Test");
    await waitForOpenModal("#atv-poster-modal");

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    closeTransition();

    expect(document.querySelector("#atv-poster-modal")).toBeNull();
  });

  it("dismisses via click outside after the ModalShell transition", async () => {
    vi.useFakeTimers();
    openPosterModal("https://img.example.com/poster.jpg", "Test");
    const modal = await waitForOpenModal("#atv-poster-modal");

    modal.click();
    closeTransition();

    expect(document.querySelector("#atv-poster-modal")).toBeNull();
  });
});

describe("openVideoModal(trailer)", () => {
  beforeEach(() => {
    stubRaf();
    vi.spyOn(window, "open").mockReturnValue(null);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(SUCCESS_HTML, { status: 200 })
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    cleanupDom();
  });

  it("creates a labelled video ModalShell overlay", () => {
    openVideoModal(TRAILER);

    const modal = document.querySelector("#atv-video-modal");
    expect(modal).not.toBeNull();
    expect(modal?.className).toContain("atv-modal-overlay");
    expect(modal?.className).toContain("is-video");
    expect(modal?.getAttribute("aria-label")).toBe(TRAILER.title);
  });

  it("injects style element for spinner animations only once", () => {
    openVideoModal(TRAILER);
    openVideoModal(TRAILER);

    const styles = document.querySelectorAll("#atv-vs");
    expect(styles).toHaveLength(1);
    expect(styles[0] instanceof HTMLStyleElement).toBeTruthy();
  });

  it("replaces existing video modal on second call", () => {
    openVideoModal(TRAILER);
    const first = document.querySelector("#atv-video-modal");
    openVideoModal(TRAILER);

    expect(document.body.contains(first)).toBeFalsy();
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

  it("opens with body scroll locked", async () => {
    openVideoModal(TRAILER);

    const modal = await waitForOpenModal("#atv-video-modal");
    expect(modal.id).toBe("atv-video-modal");
  });

  it("dismisses via close button after the ModalShell transition", async () => {
    vi.useFakeTimers();
    openVideoModal(TRAILER);
    await waitForOpenModal("#atv-video-modal");

    document
      .querySelector<HTMLButtonElement>("#atv-video-modal .atv-modal-close")
      ?.click();
    closeTransition();

    expect(document.querySelector("#atv-video-modal")).toBeNull();
  });

  it("dismisses via Escape key after the ModalShell transition", async () => {
    vi.useFakeTimers();
    openVideoModal(TRAILER);
    await waitForOpenModal("#atv-video-modal");

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    closeTransition();

    expect(document.querySelector("#atv-video-modal")).toBeNull();
  });

  it("dismisses via click outside after the ModalShell transition", async () => {
    vi.useFakeTimers();
    openVideoModal(TRAILER);
    const modal = await waitForOpenModal("#atv-video-modal");

    modal.click();
    closeTransition();

    expect(document.querySelector("#atv-video-modal")).toBeNull();
  });

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
    vi.spyOn(window, "open").mockReturnValue(null);
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
  });

  it("auto-removes error toast after 3 seconds", async () => {
    vi.restoreAllMocks();
    stubRaf();
    vi.spyOn(window, "open").mockReturnValue(null);
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("fail"));
    vi.useFakeTimers();
    openVideoModal(TRAILER);

    await vi.waitFor(() => {
      expect(document.querySelector(".atv-modal-toast")).not.toBeNull();
    });
    vi.advanceTimersByTime(3000);

    expect(document.querySelector(".atv-modal-toast")).toBeNull();
  });

  it("does not create video if modal is dismissed before fetch completes", async () => {
    let resolveFetch!: (value: Response) => void;
    // oxlint-disable-next-line promise/avoid-new
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    vi.restoreAllMocks();
    stubRaf();
    vi.spyOn(window, "open").mockReturnValue(null);
    vi.spyOn(globalThis, "fetch").mockReturnValue(fetchPromise);
    vi.useFakeTimers();
    openVideoModal(TRAILER);
    await waitForOpenModal("#atv-video-modal");

    document
      .querySelector<HTMLButtonElement>("#atv-video-modal .atv-modal-close")
      ?.click();
    closeTransition();
    resolveFetch(new Response(SUCCESS_HTML, { status: 200 }));

    await vi.waitFor(() => {
      expect(document.querySelector(".atv-modal-video")).toBeNull();
    });
  });

  it("handles ld+json without embedUrl as error", async () => {
    const noEmbedHtml = `<html><head><script type="application/ld+json">{"title":"No Video"}</script></head></html>`;
    vi.restoreAllMocks();
    stubRaf();
    vi.spyOn(window, "open").mockReturnValue(null);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(noEmbedHtml, { status: 200 })
    );
    vi.useFakeTimers();
    openVideoModal(TRAILER);

    await vi.waitFor(() => {
      expect(document.querySelector(".atv-modal-toast")).not.toBeNull();
    });
    vi.advanceTimersByTime(2000);

    expect(window.open).toHaveBeenCalledOnce();
    expect(document.querySelector("#atv-video-modal")).toBeNull();
  });
});
