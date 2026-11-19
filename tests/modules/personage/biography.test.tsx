import { readFileSync } from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { mountPersonage } from "@/modules/personage";

import { createTestDoc } from "../../helpers/doc";

const personageFixture = readFileSync(
  path.resolve(process.cwd(), "tests/fixtures/personage-full.html"),
  "utf-8"
);

class TestResizeObserver {
  static instances: TestResizeObserver[] = [];

  disconnected = false;
  isObserving = false;
  private readonly onResize: ResizeObserverCallback;

  constructor(onResize: ResizeObserverCallback) {
    this.onResize = onResize;
    TestResizeObserver.instances.push(this);
  }

  observe() {
    this.isObserving = true;
  }

  unobserve() {
    this.isObserving = false;
  }

  disconnect() {
    this.disconnected = true;
    this.isObserving = false;
  }

  trigger() {
    this.onResize([], this as unknown as ResizeObserver);
  }
}

describe(mountPersonage, () => {
  afterEach(() => {
    TestResizeObserver.instances = [];
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("places the biography after the portrait and full identity block", () => {
    const { cleanup, doc } = createTestDoc(
      personageFixture,
      "/personage/27224733/"
    );

    mountPersonage(doc);

    const hero = doc.querySelector(".atv-personage-hero-inner");
    const identity = hero?.querySelector(".atv-personage-identity");
    const biography = hero?.querySelector(".atv-personage-biography");

    expect(biography?.parentElement).toBe(hero);
    expect(biography?.previousElementSibling).toBe(identity);

    cleanup();
  });

  it("rechecks the three-line disclosure as available width changes", async () => {
    vi.stubGlobal("ResizeObserver", TestResizeObserver);
    let naturalHeight = 112;
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockImplementation(
      function biographyScrollHeight(this: HTMLElement) {
        return this.classList.contains("is-clamped") ? 84 : naturalHeight;
      }
    );
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      lineHeight: "28px",
    } as CSSStyleDeclaration);
    const { cleanup, doc } = createTestDoc(
      personageFixture,
      "/personage/27224733/"
    );

    mountPersonage(doc);
    await vi.waitFor(() =>
      expect(
        doc.querySelector(".atv-personage-biography button")
      ).not.toBeNull()
    );

    const observer = TestResizeObserver.instances.find(
      (instance) => !instance.disconnected && instance.isObserving
    );
    expect(observer).toBeDefined();

    observer?.trigger();
    expect(doc.querySelector(".atv-personage-biography button")).not.toBeNull();

    naturalHeight = 84;
    observer?.trigger();
    await vi.waitFor(() =>
      expect(doc.querySelector(".atv-personage-biography button")).toBeNull()
    );

    naturalHeight = 112;
    observer?.trigger();
    await vi.waitFor(() =>
      expect(
        doc.querySelector(".atv-personage-biography button")
      ).not.toBeNull()
    );

    cleanup();
  });

  it("keeps the current personage section order", () => {
    const { cleanup, doc } = createTestDoc(
      personageFixture,
      "/personage/27224733/"
    );

    mountPersonage(doc);

    const sections = [
      ...doc.querySelectorAll<HTMLElement>(".atv-personage > *"),
    ].filter((section) => section.id);

    expect(sections.map((section) => section.id)).toStrictEqual([
      "atv-personage-awards",
      "atv-personage-recent-works",
      "atv-personage-representative-works",
      "atv-personage-collaborators",
      "atv-personage-gallery",
    ]);

    cleanup();
  });
});
