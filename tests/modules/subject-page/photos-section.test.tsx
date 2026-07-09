import { describe, expect, it } from "vitest";

import { PhotosSection } from "@/modules/subject-page/media";
import type { Photo, PhotosData, Trailer } from "@/types";

import { renderIntoRoot } from "../../helpers/render";

const makePhoto = (overrides?: Partial<Photo>): Photo => ({
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

const makeData = (overrides?: Partial<PhotosData>): PhotosData => ({
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
    expect(section?.querySelector("h2")?.textContent).toBe("剧照");
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
});
