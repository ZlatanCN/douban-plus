import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Section } from "@/shared/components/layout/section";

import { renderIntoRoot } from "../helpers/render";

/* ── IntersectionObserver stub (triggerable) ────────────
   Mirrors the stub in tests/runtime/use-sticky-navigation.test.tsx but
   records instances and exposes a `trigger` so tests can fire intersection
   callbacks on demand. The callback is captured via an `unknown` ctor param
   (re-typed inside) so the lint rule for Node-style callbacks stays quiet. */
type StubEntry = { isIntersecting: boolean; target: Element };

type StubCallback = (
  entries: IntersectionObserverEntry[],
  observer: IntersectionObserver
) => void;

const instances: StubIO[] = [];

class StubIO {
  callback: StubCallback | null = null;
  elements = new Set<Element>();
  constructor(handler: unknown) {
    this.callback = handler as StubCallback;
    instances.push(this);
  }
  observe = (element: Element): void => {
    this.elements.add(element);
  };
  unobserve = (element: Element): void => {
    this.elements.delete(element);
  };
  disconnect = (): void => {
    this.elements.clear();
  };
  trigger(entries: StubEntry[]): void {
    this.callback?.(
      entries.map((entry) => ({
        boundingClientRect: {} as DOMRectReadOnly,
        intersectionRatio: entry.isIntersecting ? 1 : 0,
        intersectionRect: {} as DOMRectReadOnly,
        isIntersecting: entry.isIntersecting,
        rootBounds: null,
        target: entry.target,
        time: 0,
      })) as IntersectionObserverEntry[],
      this as unknown as IntersectionObserver
    );
  }
}

const stubIntersectionObserver = (): void => {
  instances.length = 0;
  vi.stubGlobal("IntersectionObserver", StubIO);
};

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

describe("useSectionReveal", () => {
  beforeEach(() => {
    stubIntersectionObserver();
    vi.stubGlobal("matchMedia", makeMatchMediaMock(false));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("flags every section with the reveal hook attributes", async () => {
    const root = renderIntoRoot(
      <Section id="atv-cast" title="演职员">
        x
      </Section>
    );
    const section = root.querySelector<HTMLElement>(".atv-section");
    expect(section).not.toBeNull();
    expect(section?.classList.contains("atv-section-reveal")).toBeTruthy();
    expect(section?.dataset.atvSectionReveal).toBeDefined();

    // Flush the deferred effect so its observer is created and tracked here
    // rather than leaking into the next test's `instances` assertions.
    await vi.waitFor(() => expect(instances.length).toBeGreaterThanOrEqual(1));
  });

  it("does not reveal a section before it intersects", async () => {
    const root = renderIntoRoot(
      <Section id="atv-cast" title="演职员">
        x
      </Section>
    );
    const section = root.querySelector<HTMLElement>(
      ".atv-section"
    ) as HTMLElement;

    await vi.waitFor(() => expect(instances).toHaveLength(1));
    instances[0].trigger([{ isIntersecting: false, target: section }]);

    expect(section.classList.contains("is-revealed")).toBeFalsy();
  });

  it("reveals the section once it intersects the viewport", async () => {
    const root = renderIntoRoot(
      <Section id="atv-cast" title="演职员">
        x
      </Section>
    );
    const section = root.querySelector<HTMLElement>(
      ".atv-section"
    ) as HTMLElement;
    expect(section.classList.contains("is-revealed")).toBeFalsy();

    await vi.waitFor(() => expect(instances).toHaveLength(1));
    instances[0].trigger([{ isIntersecting: true, target: section }]);

    expect(section.classList.contains("is-revealed")).toBeTruthy();
  });

  it("marks the section revealed immediately under reduced motion", async () => {
    vi.stubGlobal("matchMedia", makeMatchMediaMock(true));

    const root = renderIntoRoot(
      <Section id="atv-cast" title="演职员">
        x
      </Section>
    );
    const section = root.querySelector<HTMLElement>(
      ".atv-section"
    ) as HTMLElement;

    // Reduced motion short-circuits before observing, so no observer is used.
    await vi.waitFor(() =>
      expect(section.classList.contains("is-revealed")).toBeTruthy()
    );
    expect(instances).toHaveLength(0);
  });
});
