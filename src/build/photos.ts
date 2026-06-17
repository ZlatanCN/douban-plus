import { el } from "../components/dom-factory";
import type { Photo } from "../types";
import { buildSectionHeader } from "./sections";

const buildPhotos = (data: { photos: Photo[] }): HTMLElement | null => {
  if (!data.photos?.length) {
    return null;
  }
  const sec = el("section", { className: "atv-section", id: "atv-photos" });
  sec.append(buildSectionHeader("剧照"));
  const carousel = el("div", { className: "atv-carousel atv-photos" });
  for (const p of data.photos) {
    const tile = el(
      p.link ? "a" : "div",
      p.link
        ? {
            className: "atv-photo-tile",
            href: p.link,
            rel: "noopener",
            target: "_blank",
          }
        : { className: "atv-photo-tile" }
    );
    const img = el("img", { alt: "剧照", src: p.hdUrl || p.thumbUrl });
    img.loading = "lazy";
    img.addEventListener(
      "error",
      () => {
        if (p.thumbUrl && img.src !== p.thumbUrl) {
          img.src = p.thumbUrl;
        }
      },
      { once: true }
    );
    tile.append(img);
    carousel.append(tile);
  }
  sec.append(carousel);
  return sec;
};

export { buildPhotos };
