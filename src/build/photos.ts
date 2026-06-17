import { el } from "../components/dom-factory";
import { buildSectionHeader } from "./sections";
import type { Photo } from "../types";

function buildPhotos(data: { photos: Photo[] }): HTMLElement | null {
  if (!data.photos?.length) {
    return null;
  }
  const sec = el("section", { className: "atv-section", id: "atv-photos" });
  sec.appendChild(buildSectionHeader("剧照"));
  const carousel = el("div", { className: "atv-carousel atv-photos" });
  for (const p of data.photos) {
    const tile = el(
      p.link ? "a" : "div",
      p.link
        ? { className: "atv-photo-tile", href: p.link, target: "_blank", rel: "noopener" }
        : { className: "atv-photo-tile" },
    );
    const img = el("img", { src: p.hdUrl || p.thumbUrl, alt: "剧照" });
    img.loading = "lazy";
    img.onerror = () => {
      if (p.thumbUrl && img.src !== p.thumbUrl) {
        img.src = p.thumbUrl;
      }
    };
    tile.appendChild(img);
    carousel.appendChild(tile);
  }
  sec.appendChild(carousel);
  return sec;
}

export { buildPhotos };
