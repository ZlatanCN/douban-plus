import { readFileSync } from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { mountPersonage } from "@/modules/personage/runtime/mount";

import { createTestDoc } from "../../helpers/doc";

const personageFixture = readFileSync(
  path.resolve(process.cwd(), "tests/fixtures/personage-full.html"),
  "utf-8"
);

const mockBiographyLayout = (scrollHeight: number, lineHeight = 28) => {
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(
    scrollHeight
  );
  vi.spyOn(window, "getComputedStyle").mockReturnValue({
    lineHeight: `${lineHeight}px`,
  } as CSSStyleDeclaration);
};

describe("personage Hero biography disclosure", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("expands the biography inside the Hero", async () => {
    const { cleanup, doc } = createTestDoc(
      personageFixture,
      "/personage/27224733/"
    );

    mockBiographyLayout(112);
    mountPersonage(doc);
    await vi.waitFor(() =>
      expect(
        doc.querySelector(".atv-personage-biography button")
      ).not.toBeNull()
    );
    const button = doc.querySelector<HTMLButtonElement>(
      ".atv-personage-biography button"
    );

    button?.click();
    await Promise.resolve();

    expect(
      doc
        .querySelector<HTMLButtonElement>(".atv-personage-biography button")
        ?.getAttribute("aria-expanded")
    ).toBe("true");
    expect(
      doc.querySelector<HTMLButtonElement>(".atv-personage-biography button")
        ?.textContent
    ).toBe("收起");

    cleanup();
  });

  it("does not render an expand control when the biography fits three lines", () => {
    const { cleanup, doc } = createTestDoc(
      personageFixture,
      "/personage/27224733/"
    );

    mockBiographyLayout(84);
    mountPersonage(doc);

    expect(doc.querySelector(".atv-personage-biography button")).toBeNull();
    expect(
      doc.querySelector(".atv-personage-biography-content")?.classList
    ).toContain("is-expanded");

    cleanup();
  });
});
