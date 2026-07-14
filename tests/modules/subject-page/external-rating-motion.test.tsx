import type { AnimationPlaybackControlsWithThen } from "motion";
import { render } from "preact";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ExternalRating } from "@/modules/subject-page/ratings/external-rating";
import type { animateWithReducedMotion } from "@/utils/springs";

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

vi.mock(import("@/utils/springs"), async (importOriginal) => ({
  ...(await importOriginal()),
  animateWithReducedMotion: motion.animate,
}));

const flushEffects = async (): Promise<void> => {
  await Promise.resolve();
  vi.advanceTimersByTime(50);
  await Promise.resolve();
};

describe(ExternalRating, () => {
  let root: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    motion.animations.length = 0;
    motion.animate.mockClear();
    root = document.createElement("div");
  });

  afterEach(() => {
    render(null, root);
    vi.useRealTimers();
  });

  it("keeps the panel mounted until Motion completes its exit", async () => {
    render(
      <ExternalRating
        rating={{ count: 1_200_000, score: 8.5 }}
        resolved
        source="imdb"
      />,
      root
    );
    await flushEffects();

    render(<ExternalRating rating={null} resolved source="imdb" />, root);
    await flushEffects();

    expect(root.firstElementChild).not.toBeNull();
    expect(motion.animations).toHaveLength(2);

    motion.animations[1]?.resolve();
    await flushEffects();

    expect(root.firstElementChild).toBeNull();
  });

  it("cancels an exit when a rating reappears", async () => {
    render(
      <ExternalRating
        rating={{ count: 1_200_000, score: 8.5 }}
        resolved
        source="imdb"
      />,
      root
    );
    await flushEffects();

    render(<ExternalRating rating={null} resolved source="imdb" />, root);
    await flushEffects();
    const [, exit] = motion.animations;

    render(
      <ExternalRating
        rating={{ count: 1_200_000, score: 8.5 }}
        resolved
        source="imdb"
      />,
      root
    );
    exit?.resolve();
    await flushEffects();

    expect(exit?.stop).toHaveBeenCalledOnce();
    expect(root.firstElementChild).not.toBeNull();
    expect(root.querySelector(".atv-rating-panel-score")?.textContent).toBe(
      "8.5"
    );
  });

  it("animates a rating that arrives after an initially omitted source", async () => {
    render(<ExternalRating rating={null} resolved source="imdb" />, root);
    await flushEffects();

    render(
      <ExternalRating
        rating={{ count: 1_200_000, score: 8.5 }}
        resolved
        source="imdb"
      />,
      root
    );
    await flushEffects();

    expect(motion.animate).toHaveBeenCalledOnce();
    expect(root.firstElementChild).not.toBeNull();
  });
});
