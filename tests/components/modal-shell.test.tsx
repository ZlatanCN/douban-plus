import type { AnimationPlaybackControlsWithThen } from "motion";
import { render } from "preact";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ModalShell } from "@/components/modal";
import type { animateWithReducedMotion } from "@/utils/springs";

import { renderIntoRoot } from "../helpers/render";

const motion = vi.hoisted(() => {
  const animations: { resolve: () => void }[] = [];
  const animate = vi.fn<typeof animateWithReducedMotion>(() => {
    const completion = Promise.withResolvers<null>();
    animations.push({ resolve: () => completion.resolve(null) });
    return {
      attachTimeline: vi.fn<(...args: unknown[]) => VoidFunction>(),
      cancel: vi.fn<(...args: unknown[]) => void>(),
      complete: vi.fn<(...args: unknown[]) => void>(),
      duration: 0,
      finished: completion.promise,
      iterationDuration: 0,
      pause: vi.fn<(...args: unknown[]) => void>(),
      play: vi.fn<(...args: unknown[]) => void>(),
      speed: 1,
      startTime: null,
      state: "running",
      stop: vi.fn<(...args: unknown[]) => void>(),
      // eslint-disable-next-line unicorn/no-thenable -- Motion's animation control is awaitable.
      then: vi.fn<(...args: unknown[]) => Promise<void>>(),
      time: 0,
    } satisfies AnimationPlaybackControlsWithThen;
  });

  return { animate, animations };
});

vi.mock(import("@/utils/springs"), () => ({
  animateWithReducedMotion: motion.animate,
  springConfigs: {
    carouselSnap: { damping: 18, stiffness: 200, type: "spring" },
    contentEntrance: { damping: 28, stiffness: 300, type: "spring" },
    modalBackdrop: { bounce: 0, duration: 0.4, type: "spring" },
    modalSurface: { bounce: 0, duration: 0.35, type: "spring" },
    stickyNav: { damping: 28, stiffness: 300, type: "spring" },
    swipeToDismiss: { damping: 15, stiffness: 180, type: "spring" },
  } as const,
}));

const flushEffects = async (): Promise<void> => {
  await Promise.resolve();
  vi.advanceTimersByTime(0);
  await Promise.resolve();
};

const flushAnimationSettlement = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

const renderModal = (onClose: () => void, openRequestId?: number) =>
  renderIntoRoot(
    <ModalShell
      className="atv-test-modal"
      id="atv-test-modal"
      onClose={onClose}
      openRequestId={openRequestId}
      surfaceClassName="atv-test-modal-surface"
    >
      内容
    </ModalShell>
  );

describe(ModalShell, () => {
  beforeEach(() => {
    vi.useFakeTimers();
    motion.animations.length = 0;
    motion.animate.mockClear();
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
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("uses independent critically-damped springs for the backdrop and surface on mount", async () => {
    const root = renderModal(vi.fn<() => void>());

    await flushEffects();

    const overlay = root.querySelector<HTMLDialogElement>("dialog");
    const surface = root.querySelector<HTMLDivElement>(
      ".atv-test-modal-surface"
    );
    expect(motion.animate).toHaveBeenNthCalledWith(1, overlay, {
      properties: { opacity: 1 },
      reducedMotionProperties: { opacity: 1 },
      springConfig: { bounce: 0, duration: 0.4, type: "spring" },
    });
    expect(motion.animate).toHaveBeenNthCalledWith(2, surface, {
      properties: { opacity: 1, transform: "scale(1) translateY(0)" },
      reducedMotionProperties: { opacity: 1 },
      springConfig: { bounce: 0, duration: 0.35, type: "spring" },
    });
  });

  it("only notifies its owner after both close springs settle", async () => {
    const onClose = vi.fn<() => void>();
    const root = renderModal(onClose);
    const overlay = root.querySelector<HTMLDialogElement>("dialog");

    await flushEffects();
    overlay?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flushEffects();
    expect(overlay?.style.pointerEvents).toBe("none");

    motion.animations[2]?.resolve();
    await flushAnimationSettlement();
    expect(onClose).not.toHaveBeenCalled();

    motion.animations[3]?.resolve();
    await flushAnimationSettlement();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("retargets an explicit reopen request while the close spring is running", async () => {
    const onClose = vi.fn<() => void>();
    const root = renderModal(onClose, 1);
    const overlay = root.querySelector<HTMLDialogElement>("dialog");

    await flushEffects();
    overlay?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flushEffects();
    render(
      <ModalShell
        className="atv-test-modal"
        id="atv-test-modal"
        onClose={onClose}
        openRequestId={2}
        surfaceClassName="atv-test-modal-surface"
      >
        内容
      </ModalShell>,
      root
    );

    expect(motion.animate).toHaveBeenCalledTimes(6);
    expect(motion.animate).toHaveBeenNthCalledWith(5, overlay, {
      properties: { opacity: 1 },
      reducedMotionProperties: { opacity: 1 },
      springConfig: { bounce: 0, duration: 0.4, type: "spring" },
    });
    motion.animations[2]?.resolve();
    motion.animations[3]?.resolve();
    await flushAnimationSettlement();
    expect(onClose).not.toHaveBeenCalled();

    await flushEffects();
    expect(overlay?.style.pointerEvents).toBe("auto");

    motion.animations[4]?.resolve();
    motion.animations[5]?.resolve();
    await flushAnimationSettlement();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("moves the surface below the viewport while closing", async () => {
    const root = renderModal(vi.fn<() => void>());
    const overlay = root.querySelector<HTMLDialogElement>("dialog");
    const surface = root.querySelector<HTMLDivElement>(
      ".atv-test-modal-surface"
    );

    await flushEffects();
    overlay?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flushEffects();

    expect(motion.animate).toHaveBeenNthCalledWith(4, surface, {
      properties: {
        opacity: 0,
        transform: "scale(0.92) translateY(100dvh)",
      },
      reducedMotionProperties: { opacity: 0 },
      springConfig: { bounce: 0, duration: 0.35, type: "spring" },
    });
  });

  it("keeps the surface at its normal geometry for reduced motion", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));

    const root = renderModal(vi.fn<() => void>());
    const surface = root.querySelector<HTMLDivElement>(
      ".atv-test-modal-surface"
    );

    expect(surface?.style.transform).toBe("none");
  });
});
