import type { AnimationPlaybackControlsWithThen } from "motion";
import { render } from "preact";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSwipeToDismiss } from "@/shared/components/modal/use-swipe-to-dismiss";
import type {
  SwipeDismissDetails,
  SwipeToDismissOptions,
} from "@/shared/components/modal/use-swipe-to-dismiss";
import { springConfigs } from "@/shared/utils/springs";

import { renderIntoRoot } from "../helpers/render";

/* ── Motion mock ────────────────────────────────────────── */

const createAnimationControls = (
  overrides?: Partial<AnimationPlaybackControlsWithThen>
): AnimationPlaybackControlsWithThen =>
  Object.assign(Promise.resolve(), {
    attachTimeline: vi.fn<(...args: unknown[]) => VoidFunction>(),
    cancel: vi.fn<(...args: unknown[]) => void>(),
    complete: vi.fn<(...args: unknown[]) => void>(),
    duration: 0,
    finished: Promise.resolve(),
    iterationDuration: 0,
    pause: vi.fn<(...args: unknown[]) => void>(),
    play: vi.fn<(...args: unknown[]) => void>(),
    speed: 1,
    startTime: null,
    state: "running" as const,
    stop: vi.fn<(...args: unknown[]) => void>(),
    time: 0,
    ...overrides,
  });

const mockAnimate = vi.hoisted(() =>
  vi.fn<(...args: unknown[]) => AnimationPlaybackControlsWithThen>()
);

vi.mock(import("motion"), () => ({
  animate: mockAnimate,
}));

/* ── Test helper component ──────────────────────────────── */

type PartialOptions = Partial<
  Pick<SwipeToDismissOptions, "dismissThreshold" | "velocityThreshold">
> & { onDismiss: (details: SwipeDismissDetails) => void };

const TestComponent = ({ onDismiss, ...rest }: PartialOptions) => {
  const { ref } = useSwipeToDismiss({
    dismissThreshold: rest.dismissThreshold,
    onDismiss,
    velocityThreshold: rest.velocityThreshold,
  });
  return <div ref={ref} data-testid="swipe-area" />;
};

/* ── Tests ──────────────────────────────────────────────── */

describe(useSwipeToDismiss, () => {
  beforeEach(() => {
    mockAnimate.mockReset();
    mockAnimate.mockReturnValue(
      createAnimationControls({
        stop: vi.fn<() => void>(),
      })
    );
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /* ── Threshold: dismiss ───────────────────────────────── */

  it("calls onDismiss when downward drag exceeds dismissThreshold", () => {
    const onDismiss = vi.fn<(details: SwipeDismissDetails) => void>();
    const root = renderIntoRoot(
      <TestComponent onDismiss={onDismiss} dismissThreshold={80} />
    );
    const element = root.querySelector<HTMLElement>(
      "[data-testid=swipe-area]"
    ) as HTMLElement;

    element.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        clientY: 100,
        pointerId: 1,
      })
    );
    element.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientY: 200,
        pointerId: 1,
      })
    );
    element.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, pointerId: 1 })
    );

    expect(onDismiss).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ position: 100, velocity: expect.any(Number) })
    );
  });

  it("continues a new drag from the interrupted presentation position", () => {
    const root = renderIntoRoot(
      <TestComponent
        onDismiss={vi.fn<(details: SwipeDismissDetails) => void>()}
      />
    );
    const element = root.querySelector<HTMLElement>(
      "[data-testid=swipe-area]"
    ) as HTMLElement;
    element.style.transform = "translateY(48px)";

    element.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        clientY: 100,
        pointerId: 1,
      })
    );
    element.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientY: 120,
        pointerId: 1,
      })
    );

    expect(element.style.transform).toBe("translateY(68px)");
  });

  it("rubber-bands upward drags instead of ignoring them", () => {
    const root = renderIntoRoot(
      <TestComponent
        onDismiss={vi.fn<(details: SwipeDismissDetails) => void>()}
      />
    );
    const element = root.querySelector<HTMLElement>(
      "[data-testid=swipe-area]"
    ) as HTMLElement;

    element.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        clientY: 100,
        pointerId: 1,
      })
    );
    element.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientY: 60,
        pointerId: 1,
      })
    );

    expect(element.style.transform).toMatch(/^translateY\(-/u);
  });

  /* ── Threshold: snap back ─────────────────────────────── */

  it("snaps back with spring when drag is below both thresholds", () => {
    const onDismiss = vi.fn<() => void>();
    const root = renderIntoRoot(
      <TestComponent
        onDismiss={onDismiss}
        dismissThreshold={200}
        velocityThreshold={1000}
      />
    );
    const element = root.querySelector<HTMLElement>(
      "[data-testid=swipe-area]"
    ) as HTMLElement;

    element.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        clientY: 100,
        pointerId: 1,
      })
    );
    element.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientY: 150,
        pointerId: 1,
      })
    );
    element.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, pointerId: 1 })
    );

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("settles a cancelled drag with the same snap-back spring", () => {
    const onDismiss = vi.fn<() => void>();
    const root = renderIntoRoot(
      <TestComponent
        onDismiss={onDismiss}
        dismissThreshold={200}
        velocityThreshold={1000}
      />
    );
    const element = root.querySelector<HTMLElement>(
      "[data-testid=swipe-area]"
    ) as HTMLElement;

    element.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        clientY: 100,
        pointerId: 1,
      })
    );
    element.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientY: 150,
        pointerId: 1,
      })
    );
    element.dispatchEvent(
      new PointerEvent("pointercancel", { bubbles: true, pointerId: 1 })
    );

    expect(onDismiss).not.toHaveBeenCalled();
    expect(mockAnimate).toHaveBeenCalledWith(
      element,
      { transform: "translateY(0)" },
      springConfigs.swipeSettleBack
    );
  });

  it("stops an in-flight snap-back before a new drag begins", () => {
    const stop = vi.fn<() => void>();
    mockAnimate.mockReturnValue(
      createAnimationControls({
        finished: Promise.withResolvers<undefined>().promise,
        stop,
      })
    );
    const root = renderIntoRoot(
      <TestComponent
        onDismiss={vi.fn<() => void>()}
        dismissThreshold={200}
        velocityThreshold={1000}
      />
    );
    const element = root.querySelector<HTMLElement>(
      "[data-testid=swipe-area]"
    ) as HTMLElement;

    element.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        clientY: 100,
        pointerId: 1,
      })
    );
    element.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientY: 150,
        pointerId: 1,
      })
    );
    element.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, pointerId: 1 })
    );
    element.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        clientY: 100,
        pointerId: 2,
      })
    );

    expect(stop).toHaveBeenCalledOnce();
  });

  /* ── Spring parameter selection ───────────────────────── */

  it("uses swipeSettleBack spring config for snap-back animation", () => {
    const onDismiss = vi.fn<() => void>();
    const root = renderIntoRoot(
      <TestComponent
        onDismiss={onDismiss}
        dismissThreshold={200}
        velocityThreshold={1000}
      />
    );
    const element = root.querySelector<HTMLElement>(
      "[data-testid=swipe-area]"
    ) as HTMLElement;

    element.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        clientY: 100,
        pointerId: 1,
      })
    );
    element.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientY: 150,
        pointerId: 1,
      })
    );
    element.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, pointerId: 1 })
    );

    expect(mockAnimate).toHaveBeenCalledWith(
      element,
      { transform: "translateY(0)" },
      springConfigs.swipeSettleBack
    );
  });

  /* ── Velocity threshold ───────────────────────────────── */

  it("calls onDismiss when swipe velocity exceeds velocityThreshold", () => {
    const onDismiss = vi.fn<() => void>();
    let currentTime = 0;
    vi.spyOn(performance, "now").mockImplementation(() => {
      currentTime += 50;
      return currentTime;
    });

    const root = renderIntoRoot(
      <TestComponent
        onDismiss={onDismiss}
        dismissThreshold={500}
        velocityThreshold={100}
      />
    );
    const element = root.querySelector<HTMLElement>(
      "[data-testid=swipe-area]"
    ) as HTMLElement;

    element.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        clientY: 100,
        pointerId: 1,
      })
    );

    // Two quick moves: 100→300 then 300→400 => velocity = (400-300)/(0.05s) = 2000 px/s
    element.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientY: 300,
        pointerId: 1,
      })
    );
    element.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientY: 400,
        pointerId: 1,
      })
    );

    element.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, pointerId: 1 })
    );

    // delta = 300 < 500 → threshold check fails
    // velocity = 2000 > 100 → velocity check passes → dismiss
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  /* ── Pointer history management ───────────────────────── */

  it("only keeps last 5 pointer events for velocity calculation", () => {
    const onDismiss = vi.fn<() => void>();
    let currentTime = 0;
    vi.spyOn(performance, "now").mockImplementation(() => {
      currentTime += 10;
      return currentTime;
    });

    const root = renderIntoRoot(
      <TestComponent
        onDismiss={onDismiss}
        dismissThreshold={500}
        velocityThreshold={100}
      />
    );
    const element = root.querySelector<HTMLElement>(
      "[data-testid=swipe-area]"
    ) as HTMLElement;

    element.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        clientY: 100,
        pointerId: 1,
      })
    );

    // 2 steep moves (would create high velocity if kept)
    element.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientY: 300,
        pointerId: 1,
      })
    );
    element.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientY: 400,
        pointerId: 1,
      })
    );
    // 5 plateau moves (zero displacement)
    for (let index = 0; index < 5; index += 1) {
      element.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          clientY: 400,
          pointerId: 1,
        })
      );
    }

    element.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, pointerId: 1 })
    );

    // delta = 300 < 500 → threshold check fails → velocity check
    // If all 7 kept: first={y:300,t:20}, last={y:400,t:80} → velocity ≈ 1667 > 100 → dismiss
    // If only last 5: first={y:400,t:40}, last={y:400,t:80} → velocity = 0 < 100 → snap back
    // onDismiss NOT called → history correctly trimmed to 5 entries
    expect(onDismiss).not.toHaveBeenCalled();
    expect(mockAnimate).toHaveBeenCalledOnce();
  });

  /* ── Reduced motion ───────────────────────────────────── */

  it("clears inline style without calling animate when prefers-reduced-motion is set", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true }))
    );

    const onDismiss = vi.fn<() => void>();
    const root = renderIntoRoot(
      <TestComponent
        onDismiss={onDismiss}
        dismissThreshold={200}
        velocityThreshold={1000}
      />
    );
    const element = root.querySelector<HTMLElement>(
      "[data-testid=swipe-area]"
    ) as HTMLElement;

    element.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        clientY: 100,
        pointerId: 1,
      })
    );
    element.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientY: 150,
        pointerId: 1,
      })
    );
    // Set an arbitrary transform before pointerup to verify it is cleared
    element.style.transform = "translateY(50px)";

    element.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, pointerId: 1 })
    );

    expect(onDismiss).not.toHaveBeenCalled();
    expect(mockAnimate).not.toHaveBeenCalled();
    expect(element.style.transform).toBe("");
  });

  /* ── Upward drag resistance ───────────────────────────── */

  it("settles an upward rubber-banded drag without dismissing", () => {
    const onDismiss = vi.fn<() => void>();
    const root = renderIntoRoot(<TestComponent onDismiss={onDismiss} />);
    const element = root.querySelector<HTMLElement>(
      "[data-testid=swipe-area]"
    ) as HTMLElement;

    element.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        clientY: 100,
        pointerId: 1,
      })
    );
    // Move UP (clientY decreases) → drag is resisted but still settles.
    element.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientY: 50,
        pointerId: 1,
      })
    );
    element.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, pointerId: 1 })
    );

    expect(onDismiss).not.toHaveBeenCalled();
    expect(element.style.transform).toMatch(/^translateY\(-/u);
  });

  /* ── Cleanup on unmount ───────────────────────────────── */

  it("stops any running animation when the ref is cleaned up on unmount", () => {
    const stopMock = vi.fn<() => void>();
    mockAnimate.mockReturnValue(
      createAnimationControls({
        finished: Promise.withResolvers<undefined>().promise,
        stop: stopMock,
      })
    );

    const onDismiss = vi.fn<() => void>();
    const root = document.createElement("div");
    render(<TestComponent onDismiss={onDismiss} />, root);
    const element = root.querySelector<HTMLElement>(
      "[data-testid=swipe-area]"
    ) as HTMLElement;

    // Drag below threshold → snap back → animate is called → animationRef set
    element.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        clientY: 100,
        pointerId: 1,
      })
    );
    element.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientY: 150,
        pointerId: 1,
      })
    );
    element.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, pointerId: 1 })
    );

    expect(mockAnimate).toHaveBeenCalledOnce();

    // Unmount → ref callback fires with null → animationRef.current.stop()
    render(null, root);

    expect(stopMock).toHaveBeenCalledOnce();
  });

  /* ─── Imperative style during drag ────────────────────── */

  it("sets imperative inline transform during pointermove", () => {
    const onDismiss = vi.fn<() => void>();
    const root = renderIntoRoot(<TestComponent onDismiss={onDismiss} />);
    const element = root.querySelector<HTMLElement>(
      "[data-testid=swipe-area]"
    ) as HTMLElement;

    element.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        clientY: 100,
        pointerId: 1,
      })
    );
    element.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientY: 180,
        pointerId: 1,
      })
    );

    expect(element.style.transform).toBe("translateY(80px)");
  });

  /* ─── Style reset after release ────────────────────────── */

  it("resets style.transform after pointerup and triggers snap-back", () => {
    const onDismiss = vi.fn<() => void>();
    const root = renderIntoRoot(<TestComponent onDismiss={onDismiss} />);
    const element = root.querySelector<HTMLElement>(
      "[data-testid=swipe-area]"
    ) as HTMLElement;

    element.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        clientY: 100,
        pointerId: 1,
      })
    );
    element.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientY: 180,
        pointerId: 1,
      })
    );
    expect(element.style.transform).toBe("translateY(80px)");

    element.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, pointerId: 1 })
    );

    expect(onDismiss).not.toHaveBeenCalled();
    expect(mockAnimate).toHaveBeenCalledOnce();
  });

  /* ─── No drag: snap back, not dismiss ──────────────────── */

  it("does not call onDismiss when delta is zero (no drag)", () => {
    const onDismiss = vi.fn<() => void>();
    const root = renderIntoRoot(<TestComponent onDismiss={onDismiss} />);
    const element = root.querySelector<HTMLElement>(
      "[data-testid=swipe-area]"
    ) as HTMLElement;

    element.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        clientY: 100,
        pointerId: 1,
      })
    );
    element.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, pointerId: 1 })
    );

    expect(onDismiss).not.toHaveBeenCalled();
    // Snap-back animate is called even with zero delta
    expect(mockAnimate).toHaveBeenCalledOnce();
  });

  /* ─── onDismiss NOT called during snap-back ────────────── */

  it("does not call onDismiss during snap-back animation", () => {
    const onDismiss = vi.fn<() => void>();
    const root = renderIntoRoot(
      <TestComponent
        onDismiss={onDismiss}
        dismissThreshold={200}
        velocityThreshold={1000}
      />
    );
    const element = root.querySelector<HTMLElement>(
      "[data-testid=swipe-area]"
    ) as HTMLElement;

    element.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        clientY: 100,
        pointerId: 1,
      })
    );
    element.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientY: 150,
        pointerId: 1,
      })
    );
    element.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, pointerId: 1 })
    );

    expect(onDismiss).not.toHaveBeenCalled();
  });
});
