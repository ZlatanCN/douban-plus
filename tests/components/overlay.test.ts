/* ── createOverlay() Tests ───────────────────────────────── */
/* Tests the shared overlay factory extracted from modal     */
/* implementations.                                          */

import { describe, it, expect, vi, afterEach } from "vitest";

import { el } from "../../src/components";
import { createOverlay } from "../../src/components/overlay";

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

const cleanupDom = (): void => {
  const overlay = document.querySelector("#test-modal");
  if (overlay) {
    overlay.remove();
  }
  document.body.style.overflow = "";
};

/* ── createOverlay(options) ─────────────────────────────── */

describe("createOverlay(options)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    cleanupDom();
  });

  /* ── S1: DOM structure ── */

  it("creates overlay with correct id and class", () => {
    const content = document.createElement("div");
    content.textContent = "test content";
    const ctrl = createOverlay({
      className: "test-overlay",
      content: [content],
      id: "test-modal",
    });

    const overlay = document.querySelector("#test-modal");
    expect(overlay).not.toBeNull();
    expect(overlay?.className).toContain("test-overlay");
    expect(overlay?.textContent).toContain("test content");
    const closeBtn = overlay?.querySelector("button");
    expect(closeBtn).not.toBeNull();
    expect(ctrl.overlay).toBe(overlay);
    expect(ctrl.closeBtn).toBe(closeBtn);
  });

  /* ── S2: Close button dismiss ── */

  it("dismisses via close button — removes is-open, restores scroll, removes after 350ms", () => {
    vi.useFakeTimers();
    stubRaf();
    const ctrl = createOverlay({ id: "test-modal" });
    const overlay = document.querySelector("#test-modal") as HTMLElement;
    expect(overlay.classList.contains("is-open")).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");

    ctrl.closeBtn.click();
    expect(overlay.classList.contains("is-open")).toBe(false);
    expect(document.body.style.overflow).toBe("");

    vi.advanceTimersByTime(350);
    expect(document.querySelector("#test-modal")).toBeNull();
    vi.useRealTimers();
  });

  /* ── S3: Escape key dismiss ── */

  it("dismisses via Escape key — removes is-open, restores scroll, removes after 350ms", () => {
    vi.useFakeTimers();
    stubRaf();
    createOverlay({ id: "test-modal" });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    const overlay = document.querySelector("#test-modal") as HTMLElement;
    expect(overlay.classList.contains("is-open")).toBe(false);
    expect(document.body.style.overflow).toBe("");
    vi.advanceTimersByTime(350);
    expect(document.querySelector("#test-modal")).toBeNull();
    vi.useRealTimers();
  });

  /* ── S4: Click outside dismiss ── */

  it("dismisses via click outside — removes is-open, restores scroll, removes after 350ms", () => {
    vi.useFakeTimers();
    stubRaf();
    createOverlay({ id: "test-modal" });
    const overlay = document.querySelector("#test-modal") as HTMLElement;
    // click on the overlay itself (backdrop)
    overlay.click();
    expect(overlay.classList.contains("is-open")).toBe(false);
    expect(document.body.style.overflow).toBe("");
    vi.advanceTimersByTime(350);
    expect(document.querySelector("#test-modal")).toBeNull();
    vi.useRealTimers();
  });

  /* ── S5: Replace existing ── */

  it("second call with same id removes first overlay", () => {
    stubRaf();
    createOverlay({
      content: [el("div", { text: "first" })],
      id: "test-modal",
    });
    const firstEl = document.querySelector("#test-modal");
    createOverlay({
      content: [el("div", { text: "second" })],
      id: "test-modal",
    });
    expect(document.body.contains(firstEl)).toBe(false);
    const overlay = document.querySelector("#test-modal");
    expect(overlay?.textContent).toContain("second");
  });

  /* ── S6: onClose callback ── */

  it("onClose callback fires after dismiss animation", () => {
    vi.useFakeTimers();
    stubRaf();
    const onClose = vi.fn();
    const ctrl = createOverlay({ id: "test-modal", onClose });
    ctrl.dismiss();
    vi.advanceTimersByTime(350);
    expect(onClose).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  /* ── S7: Close size ── */

  it("default closeSize (22) renders correct SVG, no leaked attribute text", () => {
    stubRaf();
    createOverlay({ id: "test-modal" });
    const btn = document.querySelector("#test-modal button") as HTMLElement;
    expect(btn).not.toBeNull();
    // The button innerHTML should be the SVG, not leaked attributes
    expect(btn.innerHTML).not.toContain('height="22"width="22"');
    const svg = btn.querySelector("svg") as SVGElement;
    expect(svg).not.toBeNull();
    expect(svg.getAttribute("width")).toBe("22");
    expect(svg.getAttribute("height")).toBe("22");
  });

  it("closeSize=16 creates 16px close button icon", () => {
    stubRaf();
    createOverlay({ closeSize: 16, id: "test-modal" });
    const svg = document.querySelector("#test-modal button svg") as SVGElement;
    expect(svg).not.toBeNull();
    expect(svg.getAttribute("width")).toBe("16");
    expect(svg.getAttribute("height")).toBe("16");
  });

  it("adopts a caller-owned close button without appending a duplicate", () => {
    stubRaf();
    const surface = el("div", { className: "surface" });
    const closeBtn = el("button", {
      attrs: { type: "button" },
      className: "surface-close",
      text: "close",
    });
    surface.append(closeBtn);

    const ctrl = createOverlay({
      closeButton: closeBtn,
      content: [surface],
      id: "test-modal",
    });
    const overlay = document.querySelector("#test-modal") as HTMLElement;

    expect(ctrl.closeBtn).toBe(closeBtn);
    expect(overlay.querySelectorAll("button")).toHaveLength(1);
    expect(surface.contains(closeBtn)).toBe(true);
  });

  /* ── S8: Double dismiss ── */

  it("second dismiss() call is no-op (does not throw)", () => {
    vi.useFakeTimers();
    stubRaf();
    const ctrl = createOverlay({ id: "test-modal" });
    // first
    ctrl.dismiss();
    // second — should not throw
    ctrl.dismiss();
    vi.advanceTimersByTime(350);
    // Should still only be one setTimeout completion (no double-remove error)
    expect(document.querySelector("#test-modal")).toBeNull();
    vi.useRealTimers();
  });
});
