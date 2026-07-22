import { render } from "preact";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Photo } from "@/modules/subject/domain";
import { useResolvedPhotoGeometry } from "@/modules/subject/runtime/use-resolved-photo-geometry";

const mockFetchPhotoGeometry = vi.hoisted(() =>
  vi.fn<
    (
      link: string,
      referer?: string
    ) => Promise<{ height: number; width: number } | null>
  >()
);

vi.mock(import("../../src/modules/subject/api/photo-geometry"), () => ({
  fetchPhotoGeometry: mockFetchPhotoGeometry,
}));

const makePhoto = (id: string): Photo => ({
  hdUrl: `https://img.example.com/${id}.jpg`,
  link: `https://movie.douban.com/photos/photo/${id}/`,
  thumbUrl: `https://img.example.com/${id}-thumb.jpg`,
});

const PhotoGeometryProbe = ({ photos }: { photos: Photo[] }) => {
  const resolution = useResolvedPhotoGeometry(photos, document);
  return (
    <output
      data-ratios={resolution.photos
        .map((photo) => photo.aspectRatio)
        .join("|")}
      data-status={resolution.status}
    />
  );
};

describe("resolved photo geometry runtime", () => {
  afterEach(() => {
    mockFetchPhotoGeometry.mockReset();
    vi.unstubAllGlobals();
  });

  it("waits for every featured photo before exposing their immutable ratios", async () => {
    const first = Promise.withResolvers<{
      height: number;
      width: number;
    } | null>();
    const second = Promise.withResolvers<{
      height: number;
      width: number;
    } | null>();
    mockFetchPhotoGeometry
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const root = document.createElement("div");
    const photos = [makePhoto("portrait"), makePhoto("landscape")];

    render(<PhotoGeometryProbe photos={photos} />, root);

    expect(root.querySelector("output")?.dataset.status).toBe("loading");
    await vi.waitFor(() =>
      expect(mockFetchPhotoGeometry).toHaveBeenCalledTimes(2)
    );
    expect(root.querySelector("output")?.dataset.ratios).toBe("");

    first.resolve({ height: 1440, width: 1080 });
    second.resolve(null);

    await vi.waitFor(() =>
      expect(root.querySelector("output")?.dataset).toMatchObject({
        ratios: "0.75|1.7777777777777777",
        status: "ready",
      })
    );
    expect(photos.map((photo) => photo.link)).toStrictEqual([
      "https://movie.douban.com/photos/photo/portrait/",
      "https://movie.douban.com/photos/photo/landscape/",
    ]);
  });

  it("does not commit a late lookup after unmount", async () => {
    const deferred = Promise.withResolvers<{
      height: number;
      width: number;
    } | null>();
    mockFetchPhotoGeometry.mockReturnValue(deferred.promise);
    const root = document.createElement("div");

    render(<PhotoGeometryProbe photos={[makePhoto("late")]} />, root);
    render(null, root);
    deferred.resolve({ height: 1440, width: 1080 });
    await Promise.resolve();

    expect(root.firstElementChild).toBeNull();
  });
});
