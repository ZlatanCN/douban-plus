/* ── buildPhotos Tests ─────────────────────────────────── */
/* Tests rendering of photos/trailers carousel tiles       */
/* and the optional "查看全部" link.                         */

import { describe, it, expect } from "vitest";

import { buildPhotos } from "../../src/build/photos";
import type { Photo, PhotosData, Trailer } from "../../src/types";

/* ── Factory helpers ─────────────────────────────────── */

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

/* ── Tests ───────────────────────────────────────────── */

describe("buildPhotos", () => {
  it("returns null when both photos[] and trailers[] are empty", () => {
    const data = makeData({ photos: [], trailers: [] });
    expect(buildPhotos(data)).toBeNull();
  });

  it("returns a section element when photos present but no trailers", () => {
    const data = makeData({ photos: [makePhoto()], trailers: [] });
    const el = buildPhotos(data);
    expect(el).not.toBeNull();
    expect((el as HTMLElement).tagName).toBe("SECTION");
    expect((el as HTMLElement).id).toBe("atv-photos");
  });

  it("returns a section element when trailers present but no photos", () => {
    const data = makeData({ photos: [], trailers: [makeTrailer()] });
    const el = buildPhotos(data);
    expect(el).not.toBeNull();
    expect((el as HTMLElement).tagName).toBe("SECTION");
  });

  it("photo tile has class 'atv-photo-tile' with an <img> element", () => {
    const data = makeData({ photos: [makePhoto()], trailers: [] });
    const section = buildPhotos(data) as HTMLElement;
    const tile = section.querySelector(".atv-photo-tile") as HTMLElement;
    expect(tile).not.toBeNull();
    expect(tile.classList.contains("atv-photo-tile")).toBe(true);
    const img = tile.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("alt")).toBe("剧照");
  });

  it("trailer tile has class 'atv-trailer-tile'", () => {
    const data = makeData({ photos: [], trailers: [makeTrailer()] });
    const section = buildPhotos(data) as HTMLElement;
    const tile = section.querySelector(".atv-trailer-tile") as HTMLElement;
    expect(tile).not.toBeNull();
    expect(tile.classList.contains("atv-trailer-tile")).toBe(true);
  });

  it("trailer tile contains .atv-trailer-play-overlay element", () => {
    const data = makeData({ photos: [], trailers: [makeTrailer()] });
    const section = buildPhotos(data) as HTMLElement;
    const tile = section.querySelector(".atv-trailer-tile") as HTMLElement;
    const overlay = tile.querySelector(".atv-trailer-play-overlay");
    expect(overlay).not.toBeNull();
    // Verify the play button SVG is inside
    const playBtn = overlay?.querySelector(".atv-trailer-play-btn");
    expect(playBtn).not.toBeNull();
  });

  it("trailer tile contains .atv-trailer-label with title text", () => {
    const data = makeData({
      photos: [],
      trailers: [makeTrailer({ title: "预告片1" })],
    });
    const section = buildPhotos(data) as HTMLElement;
    const tile = section.querySelector(".atv-trailer-tile") as HTMLElement;
    const label = tile.querySelector(".atv-trailer-label");
    expect(label).not.toBeNull();
    expect(label?.textContent).toBe("预告片1");
  });

  it('renders "查看全部 →" link when subjectId present and photos.length > 0', () => {
    const data = makeData({
      photos: [makePhoto()],
      subjectId: "1292052",
      trailers: [],
    });
    const section = buildPhotos(data) as HTMLElement;
    const link = section.querySelector(
      ".atv-section-more"
    ) as HTMLAnchorElement;
    expect(link).not.toBeNull();
    expect(link.textContent).toBe("查看全部 →");
    expect(link.getAttribute("href")).toContain("/subject/1292052/all_photos");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener");
  });

  it('does NOT render "查看全部 →" link when subjectId is empty', () => {
    const data = makeData({
      photos: [makePhoto()],
      subjectId: "",
      trailers: [],
    });
    const section = buildPhotos(data) as HTMLElement;
    expect(section.querySelector(".atv-section-more")).toBeNull();
  });

  it('renders "查看全部 →" link when trailers present with subjectId, even without photos', () => {
    const data = makeData({
      photos: [],
      subjectId: "1292052",
      trailers: [makeTrailer()],
    });
    const section = buildPhotos(data) as HTMLElement;
    const link = section.querySelector(
      ".atv-section-more"
    ) as HTMLAnchorElement;
    expect(link).not.toBeNull();
    expect(link.textContent).toBe("查看全部 →");
  });

  it("renders trailers before photos in the carousel", () => {
    const data = makeData({
      photos: [makePhoto({ thumbUrl: "https://example.com/p1.jpg" })],
      trailers: [makeTrailer({ thumbUrl: "https://example.com/t1.jpg" })],
    });
    const section = buildPhotos(data) as HTMLElement;
    const tiles = section.querySelectorAll<HTMLElement>(".atv-photo-tile");
    expect(tiles.length).toBe(2);
    // First tile should be a trailer tile (trailers iterated first)
    expect(tiles[0].classList.contains("atv-trailer-tile")).toBe(true);
    // Second tile should be a photo-only tile (no trailer class)
    expect(tiles[1].classList.contains("atv-trailer-tile")).toBe(false);
  });

  it("renders correct count of photo tiles for multiple photos", () => {
    const data = makeData({
      photos: [makePhoto(), makePhoto(), makePhoto()],
      trailers: [],
    });
    const section = buildPhotos(data) as HTMLElement;
    const photoTiles = section.querySelectorAll<HTMLElement>(
      ".atv-photo-tile:not(.atv-trailer-tile)"
    );
    expect(photoTiles.length).toBe(3);
  });

  it("renders correct count of trailer tiles for multiple trailers", () => {
    const data = makeData({
      photos: [],
      trailers: [makeTrailer(), makeTrailer()],
    });
    const section = buildPhotos(data) as HTMLElement;
    const trailerTiles =
      section.querySelectorAll<HTMLElement>(".atv-trailer-tile");
    expect(trailerTiles.length).toBe(2);
  });
});
