import { describe, expect, it } from "vitest";

import { PhotosSection } from "@/modules/subject/media";
import type { ResolvedPhoto } from "@/modules/subject/types";
import type { Trailer } from "@/types";

import { renderIntoRoot } from "../../helpers/render";

type ResolvedPhotosData = {
  photos: ResolvedPhoto[];
  subjectId: string;
  trailers: Trailer[];
};

const makePhoto = (overrides?: Partial<ResolvedPhoto>): ResolvedPhoto => ({
  aspectRatio: 16 / 9,
  hdUrl: "https://example.com/hd.jpg",
  link: "https://example.com/photo/1",
  thumbUrl: "https://example.com/thumb.jpg",
  ...overrides,
});

const makeTrailer = (overrides?: Partial<Trailer>): Trailer => ({
  thumbUrl: "https://example.com/trailer-thumb.jpg",
  title: "预告片",
  trailerPageUrl: "https://example.com/trailer/1",
  ...overrides,
});

const makeData = (
  overrides?: Partial<ResolvedPhotosData>
): ResolvedPhotosData => ({
  photos: [],
  subjectId: "1292052",
  trailers: [],
  ...overrides,
});

describe(PhotosSection, () => {
  it("renders nothing when photos and trailers are empty", () => {
    const root = renderIntoRoot(<PhotosSection data={makeData()} />);

    expect(root.firstElementChild).toBeNull();
  });

  it("renders section tag and header text when media exists", () => {
    const root = renderIntoRoot(
      <PhotosSection data={makeData({ photos: [makePhoto()] })} />
    );
    const section = root.querySelector<HTMLElement>("#atv-photos");

    expect(section?.tagName).toBe("SECTION");
    expect(section?.querySelector("h2")?.textContent).toBe("影像");
  });

  it("renders all-photos link with href, target and rel", () => {
    const root = renderIntoRoot(
      <PhotosSection data={makeData({ photos: [makePhoto()] })} />
    );
    const link = root.querySelector<HTMLAnchorElement>(".atv-section-more");

    expect(link?.textContent).toBe("查看全部 →");
    expect(link?.href).toContain("/subject/1292052/all_photos");
    expect(link?.target).toBe("_blank");
    expect(link?.rel).toBe("noopener");
  });

  it("renders trailers before photos", () => {
    const root = renderIntoRoot(
      <PhotosSection
        data={makeData({
          photos: [makePhoto()],
          trailers: [makeTrailer({ title: "预告片1" })],
        })}
      />
    );
    const tiles = root.querySelectorAll<HTMLElement>(".atv-photo-tile");

    expect(tiles).toHaveLength(2);
    expect(tiles[0]?.classList.contains("atv-trailer-tile")).toBeTruthy();
    expect(tiles[0]?.querySelector(".atv-trailer-label")?.textContent).toBe(
      "预告片1"
    );
    expect(tiles[1]?.querySelector("img")?.getAttribute("alt")).toBe("剧照");
  });

  it("keeps a resolved photo's geometry fixed after lazy image load", async () => {
    const root = renderIntoRoot(
      <PhotosSection
        data={makeData({ photos: [makePhoto({ aspectRatio: 3 / 4 })] })}
      />
    );
    const image = root.querySelector<HTMLImageElement>(".atv-photo-tile img");
    const tile = root.querySelector<HTMLElement>(".atv-photo-tile");

    if (!image) {
      throw new Error("Expected photo image");
    }
    Object.defineProperty(image, "naturalHeight", { value: 200 });
    Object.defineProperty(image, "naturalWidth", { value: 100 });
    image?.dispatchEvent(new Event("load", { bubbles: true }));
    await Promise.resolve();
    expect(tile?.classList.contains("is-portrait")).toBeFalsy();
    expect(tile?.style.getPropertyValue("--atv-photo-aspect-ratio")).toBe(
      "0.75"
    );

    image?.dispatchEvent(new Event("error", { bubbles: true }));
    await Promise.resolve();
    expect(image?.getAttribute("src")).toBe("https://example.com/thumb.jpg");
  });

  it("reserves the stable rail height while photos resolve without a trailer", () => {
    const root = renderIntoRoot(
      <PhotosSection data={makeData()} resolvingPhotos />
    );

    expect(root.querySelector("#atv-photos")).not.toBeNull();
    expect(root.querySelector(".atv-photo-rail-reserve")).not.toBeNull();
    expect(root.querySelectorAll(".atv-photo-tile")).toHaveLength(0);
  });

  it("keeps the trailer available but withholds unresolved static photos", () => {
    const root = renderIntoRoot(
      <PhotosSection
        data={makeData({ trailers: [makeTrailer()] })}
        resolvingPhotos
      />
    );

    expect(root.querySelectorAll(".atv-trailer-tile")).toHaveLength(1);
    expect(root.querySelectorAll(".atv-photo-tile")).toHaveLength(1);
    expect(root.querySelector(".atv-photo-rail-reserve")).toBeNull();
  });
});
