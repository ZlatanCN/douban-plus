import type { AnimationPlaybackControlsWithThen } from "motion";
import { render } from "preact";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useEntranceExitAnimation } from "@/shared/hooks/use-entrance-exit-animation";
import type { animateWithReducedMotion } from "@/shared/utils/springs";
import { springConfigs } from "@/shared/utils/springs";

const motion = vi.hoisted(() => {
  const animations: { resolve: () => void; stop: () => void }[] = [];
  const animate = vi.fn<typeof animateWithReducedMotion>(() => {
    const completion = Promise.withResolvers<null>();
    const stop = vi.fn<() => void>();
    animations.push({ resolve: () => completion.resolve(null), stop });
    return Object.assign(completion.promise, {
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
      state: "running" as const,
      stop,
      time: 0,
    }) satisfies AnimationPlaybackControlsWithThen;
  });
  return { animate, animations };
});

vi.mock(import("@/shared/utils/springs"), async (importOriginal) => ({
  ...(await importOriginal()),
  animateWithReducedMotion: motion.animate,
}));

const flushEffects = async (): Promise<void> => {
  await Promise.resolve();
  vi.advanceTimersByTime(50);
  await Promise.resolve();
};

type HarnessProps = {
  hasContent: boolean;
  shouldRender: boolean;
};

const Harness = ({ hasContent, shouldRender }: HarnessProps) => {
  const { rendered, setRef } = useEntranceExitAnimation(
    shouldRender,
    hasContent,
    springConfigs.ratingEntrance
  );
  if (!rendered) {
    return null;
  }
  return <div ref={setRef} data-testid="panel" />;
};

const renderHarness = (props: HarnessProps): HTMLElement => {
  const root = document.createElement("div");
  render(<Harness {...props} />, root);
  return root;
};

describe(useEntranceExitAnimation, () => {
  beforeEach(() => {
    vi.useFakeTimers();
    motion.animations.length = 0;
    motion.animate.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("renders immediately when shouldRender is true on first mount", () => {
    const root = renderHarness({ hasContent: false, shouldRender: true });
    expect(root.querySelector('[data-testid="panel"]')).not.toBeNull();
    expect(motion.animate).not.toHaveBeenCalled();
  });

  it("does not render when shouldRender is false", () => {
    const root = renderHarness({ hasContent: false, shouldRender: false });
    expect(root.querySelector('[data-testid="panel"]')).toBeNull();
  });

  it("plays an entrance animation when content arrives", async () => {
    const root = renderHarness({ hasContent: false, shouldRender: true });
    await flushEffects();

    render(<Harness hasContent shouldRender />, root);
    await flushEffects();

    expect(motion.animate).toHaveBeenCalledOnce();
  });

  it("unmounts after the exit animation finishes", async () => {
    const root = renderHarness({ hasContent: true, shouldRender: true });
    await flushEffects();

    render(<Harness hasContent={false} shouldRender={false} />, root);
    await flushEffects();

    expect(root.querySelector('[data-testid="panel"]')).not.toBeNull();
    expect(motion.animations.length).toBeGreaterThanOrEqual(1);

    motion.animations.at(-1)?.resolve();
    await flushEffects();

    expect(root.querySelector('[data-testid="panel"]')).toBeNull();
  });

  it("cancels an in-progress exit when shouldRender returns true", async () => {
    const root = renderHarness({ hasContent: true, shouldRender: true });
    await flushEffects();

    render(<Harness hasContent={false} shouldRender={false} />, root);
    await flushEffects();
    const exitAnimation = motion.animations.at(-1);

    render(<Harness hasContent shouldRender />, root);
    await flushEffects();

    expect(exitAnimation?.stop).toHaveBeenCalledOnce();
    expect(root.querySelector('[data-testid="panel"]')).not.toBeNull();
  });
});
