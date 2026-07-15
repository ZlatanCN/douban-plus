/* ── springs — Unit Tests ─────────────────────────────── */
/* Tests spring config constants and reduced‑motion util.  */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/* ── Module-Level Mocks ─────────────────────────────── */

const mockControls = Object.assign(Promise.resolve(), {
  attachTimeline: vi.fn<(...args: unknown[]) => VoidFunction>(),
  cancel: vi.fn<(...args: unknown[]) => void>(),
  complete: vi.fn<(...args: unknown[]) => void>(),
  duration: 200,
  finished: Promise.resolve(),
  iterationDuration: 200,
  pause: vi.fn<(...args: unknown[]) => void>(),
  play: vi.fn<(...args: unknown[]) => void>(),
  speed: 1,
  startTime: null,
  state: "running" as const,
  stop: vi.fn<(...args: unknown[]) => void>(),
  time: 0,
});

const mockAnimate = vi.hoisted(() =>
  vi.fn<(...args: unknown[]) => typeof mockControls>(() => mockControls)
);

vi.mock(import("motion"), () => ({
  animate: mockAnimate,
}));

const { springConfigs, animateWithReducedMotion } =
  await import("../../src/utils/springs");

/* ── Helpers ─────────────────────────────────────────── */

const makeMatchMediaMock =
  (reduce: boolean) =>
  (query: string): MediaQueryList => ({
    addEventListener: vi.fn<(...args: unknown[]) => void>(),
    addListener: vi.fn<(...args: unknown[]) => void>(),
    dispatchEvent: vi.fn<(event: Event) => boolean>(),
    matches: reduce ? query.includes("reduce") : false,
    media: query,
    onchange: null,
    removeEventListener: vi.fn<(...args: unknown[]) => void>(),
    removeListener: vi.fn<(...args: unknown[]) => void>(),
  });

/* ── Spring Config Shape ─────────────────────────────── */

describe("springConfigs", () => {
  beforeEach(() => {
    mockAnimate.mockClear();
  });

  const configNames = [
    "modalSurface",
    "modalBackdrop",
    "stickyNav",
    "contentEntrance",
    "swipeSettleBack",
    "carouselSnap",
    "ratingEntrance",
    "reviewBodyEntrance",
    "summaryEntrance",
  ] as const;

  it("exports all expected configs", () => {
    for (const name of configNames) {
      expect(springConfigs).toHaveProperty(name);
    }
  });

  it("each config has a spring type", () => {
    for (const name of configNames) {
      const c = springConfigs[name];
      expect(c).toHaveProperty("type", "spring");
    }
  });

  /* ── Per-config values ─────────────────────────────── */

  it("modalSurface → critically-damped 350 ms", () => {
    expect(springConfigs.modalSurface).toStrictEqual({
      bounce: 0,
      duration: 0.35,
      type: "spring",
    });
  });

  it("modalBackdrop → critically-damped 400 ms", () => {
    expect(springConfigs.modalBackdrop).toStrictEqual({
      bounce: 0,
      duration: 0.4,
      type: "spring",
    });
  });

  it("stickyNav → bounce 0 / duration 0.3", () => {
    expect(springConfigs.stickyNav).toStrictEqual({
      bounce: 0,
      duration: 0.3,
      type: "spring",
    });
  });

  it("contentEntrance → stiff 300 / damp 28", () => {
    expect(springConfigs.contentEntrance).toStrictEqual({
      damping: 28,
      stiffness: 300,
      type: "spring",
    });
  });

  it("swipeSettleBack → stiff 180 / damp 15", () => {
    expect(springConfigs.swipeSettleBack).toStrictEqual({
      damping: 15,
      stiffness: 180,
      type: "spring",
    });
  });

  it("carouselSnap → stiff 200 / damp 18", () => {
    expect(springConfigs.carouselSnap).toStrictEqual({
      damping: 18,
      stiffness: 200,
      type: "spring",
    });
  });

  it("ratingEntrance → bounce 0 / duration 0.3", () => {
    expect(springConfigs.ratingEntrance).toStrictEqual({
      bounce: 0,
      duration: 0.3,
      type: "spring",
    });
  });

  it("summaryEntrance → bounce 0 / duration 0.3", () => {
    expect(springConfigs.summaryEntrance).toStrictEqual({
      bounce: 0,
      duration: 0.3,
      type: "spring",
    });
  });

  it("reviewBodyEntrance → bounce 0 / duration 0.3", () => {
    expect(springConfigs.reviewBodyEntrance).toStrictEqual({
      bounce: 0,
      duration: 0.3,
      type: "spring",
    });
  });
});

/* ── animateWithReducedMotion ────────────────────────── */

describe(animateWithReducedMotion, () => {
  const el = document.createElement("div");

  beforeEach(() => {
    vi.unstubAllGlobals();
    mockAnimate.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /* ── Reduced motion ON ─────────────────────────────── */

  it("uses plain opacity transition when prefers-reduced-motion is set", () => {
    vi.stubGlobal("matchMedia", makeMatchMediaMock(true));

    animateWithReducedMotion(el, {
      properties: { opacity: 0 },
    });

    expect(mockAnimate).toHaveBeenCalledWith(
      el,
      { opacity: 0 },
      { duration: 0.2 }
    );
  });

  it("ignores springConfig argument when reduced motion is on", () => {
    vi.stubGlobal("matchMedia", makeMatchMediaMock(true));

    animateWithReducedMotion(el, {
      properties: { opacity: 0.5 },
      springConfig: springConfigs.modalSurface,
    });

    expect(mockAnimate).toHaveBeenCalledWith(
      el,
      { opacity: 0.5 },
      { duration: 0.2 }
    );
  });

  it("uses the opacity-only target supplied for reduced motion", () => {
    vi.stubGlobal("matchMedia", makeMatchMediaMock(true));

    animateWithReducedMotion(el, {
      properties: { opacity: 0, transform: "scale(0.92)" },
      reducedMotionProperties: { opacity: 0 },
    });

    expect(mockAnimate).toHaveBeenCalledWith(
      el,
      { opacity: 0 },
      { duration: 0.2 }
    );
  });

  /* ── Reduced motion OFF ────────────────────────────── */

  it("uses spring config when reduced motion is not set", () => {
    vi.stubGlobal("matchMedia", makeMatchMediaMock(false));

    animateWithReducedMotion(el, {
      properties: { opacity: 1, transform: "translateX(0)" },
    });

    expect(mockAnimate).toHaveBeenCalledWith(
      el,
      { opacity: 1, transform: "translateX(0)" },
      springConfigs.contentEntrance
    );
  });

  it("uses provided springConfig over default when reduced motion is off", () => {
    vi.stubGlobal("matchMedia", makeMatchMediaMock(false));

    animateWithReducedMotion(el, {
      properties: { opacity: 1 },
      springConfig: springConfigs.stickyNav,
    });

    expect(mockAnimate).toHaveBeenCalledWith(
      el,
      { opacity: 1 },
      springConfigs.stickyNav
    );
  });

  /* ── Return value ──────────────────────────────────── */

  it("returns the animation control object from animate()", () => {
    vi.stubGlobal("matchMedia", makeMatchMediaMock(false));

    const result = animateWithReducedMotion(el, {
      properties: { opacity: 0 },
    });

    expect(result).toBe(mockControls);
    expect(result).toHaveProperty("stop");
    expect(result.stop).toBeTypeOf("function");
  });

  it("also returns control object when reduced motion is on", () => {
    vi.stubGlobal("matchMedia", makeMatchMediaMock(true));

    const result = animateWithReducedMotion(el, {
      properties: { opacity: 0 },
    });

    expect(result).toBe(mockControls);
    expect(result).toHaveProperty("stop");
    expect(result.stop).toBeTypeOf("function");
  });
});
