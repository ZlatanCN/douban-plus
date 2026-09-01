import { describe, expect, it, vi } from "vitest";

import { buildDoc } from "../helpers/doc";

vi.mock(import("../../src/shared/utils/request"), () => ({
  gmGet: vi.fn<(url: string, referer?: string) => Promise<string>>(),
  gmPost:
    vi.fn<(url: string, data: string, referer?: string) => Promise<string>>(),
}));

const { extractPhotoGeometry } =
  await import("@/modules/subject/api/photo-geometry");

describe(extractPhotoGeometry, () => {
  it("reads positive dimensions from a Douban photo detail page", () => {
    const doc = buildDoc("<main>大图尺寸：2160x1440</main>");

    expect(extractPhotoGeometry(doc)).toStrictEqual({
      height: 1440,
      width: 2160,
    });
  });

  it("accepts the full-width multiplication sign used by some pages", () => {
    const doc = buildDoc("<main>大图尺寸: 1080 × 1920</main>");

    expect(extractPhotoGeometry(doc)).toStrictEqual({
      height: 1920,
      width: 1080,
    });
  });

  it.each([
    "<main>大图尺寸：0x1440</main>",
    "<main>大图尺寸：-2160x1440</main>",
    "<main>大图尺寸：2160.5x1440</main>",
    "<main>没有尺寸</main>",
  ])("returns null for invalid or missing dimensions", (html) => {
    expect(extractPhotoGeometry(buildDoc(html))).toBeNull();
  });
});
