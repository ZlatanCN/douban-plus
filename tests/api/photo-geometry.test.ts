import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGmGet = vi.hoisted(() =>
  vi.fn<(url: string, referer?: string) => Promise<string>>()
);

vi.mock(import("../../src/shared/utils/request"), () => ({
  gmGet: mockGmGet,
}));

const { fetchPhotoGeometry } =
  await import("@/modules/subject/api/photo-geometry");

const photoPage = (width: number, height: number): string =>
  `<main>大图尺寸：${width}x${height}</main>`;

describe(fetchPhotoGeometry, () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
  });

  it("requests the detail document once and caches its parsed geometry", async () => {
    const photoLink = "https://movie.douban.com/photos/photo/2521688540/";
    const referer = "https://movie.douban.com/subject/27036727/";
    mockGmGet.mockResolvedValue(photoPage(2160, 1440));

    await expect(fetchPhotoGeometry(photoLink, referer)).resolves.toStrictEqual(
      {
        height: 1440,
        width: 2160,
      }
    );
    await expect(fetchPhotoGeometry(photoLink, referer)).resolves.toStrictEqual(
      {
        height: 1440,
        width: 2160,
      }
    );

    expect(mockGmGet).toHaveBeenCalledExactlyOnceWith(photoLink, referer);
  });

  it("coalesces simultaneous requests for the same detail document", async () => {
    const deferred = Promise.withResolvers<string>();
    const photoLink = "https://movie.douban.com/photos/photo/2521688540/";
    mockGmGet.mockReturnValue(deferred.promise);

    const first = fetchPhotoGeometry(photoLink);
    const second = fetchPhotoGeometry(photoLink);
    expect(mockGmGet).toHaveBeenCalledOnce();

    deferred.resolve(photoPage(1080, 1920));
    await expect(Promise.all([first, second])).resolves.toStrictEqual([
      { height: 1920, width: 1080 },
      { height: 1920, width: 1080 },
    ]);
  });

  it("does not request an absent photo detail link", async () => {
    await expect(fetchPhotoGeometry("")).resolves.toBeNull();

    expect(mockGmGet).not.toHaveBeenCalled();
  });

  it("rejects a non-Douban or non-photo-detail URL before the GM boundary", async () => {
    await expect(
      fetchPhotoGeometry("https://example.com/photos/photo/2521688540/")
    ).resolves.toBeNull();
    await expect(
      fetchPhotoGeometry("https://movie.douban.com/subject/27036727/")
    ).resolves.toBeNull();

    expect(mockGmGet).not.toHaveBeenCalled();
  });

  it("degrades to null when the detail page is malformed or unavailable", async () => {
    mockGmGet.mockResolvedValue("<main>没有尺寸</main>");
    await expect(
      fetchPhotoGeometry("https://movie.douban.com/photos/photo/1/")
    ).resolves.toBeNull();

    mockGmGet.mockRejectedValue(new Error("network unavailable"));
    await expect(
      fetchPhotoGeometry("https://movie.douban.com/photos/photo/2/")
    ).resolves.toBeNull();
  });
});
