import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ModalShell } from "@/components/modal";

import { renderIntoRoot } from "../helpers/render";

const flushEffects = async (): Promise<void> => {
  await Promise.resolve();
  vi.advanceTimersByTime(0);
  await Promise.resolve();
};

const opacityTransitionEnd = (): TransitionEvent => {
  const event = new Event("transitionend", { bubbles: true });
  Object.defineProperty(event, "propertyName", { value: "opacity" });
  return event as TransitionEvent;
};

describe(ModalShell, () => {
  beforeEach(() => {
    vi.useFakeTimers();
    /* eslint-disable promise/prefer-await-to-callbacks -- requestAnimationFrame is callback-based. */
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(
      (callback: FrameRequestCallback): number => {
        callback(0);
        return 0;
      }
    );
    /* eslint-enable promise/prefer-await-to-callbacks */
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("closes from the overlay opacity transition exactly once", async () => {
    const onClose = vi.fn<() => void>();
    const root = renderIntoRoot(
      <ModalShell
        className="atv-test-modal"
        id="atv-test-modal"
        onClose={onClose}
        surfaceClassName="atv-test-modal-surface"
      >
        内容
      </ModalShell>
    );
    const overlay = root.querySelector<HTMLDialogElement>("dialog");

    await flushEffects();
    overlay?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flushEffects();
    overlay?.dispatchEvent(opacityTransitionEnd());
    overlay?.dispatchEvent(opacityTransitionEnd());

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("falls back when the overlay transition event is unavailable", async () => {
    const onClose = vi.fn<() => void>();
    const root = renderIntoRoot(
      <ModalShell
        className="atv-test-modal"
        id="atv-test-modal"
        onClose={onClose}
        surfaceClassName="atv-test-modal-surface"
      >
        内容
      </ModalShell>
    );
    const overlay = root.querySelector<HTMLDialogElement>("dialog");

    await flushEffects();
    overlay?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flushEffects();
    vi.advanceTimersByTime(500);

    expect(onClose).toHaveBeenCalledOnce();
  });
});
