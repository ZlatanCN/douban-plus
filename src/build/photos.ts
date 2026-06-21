import { el, openPosterModal } from "../components";
import type { DoubanData } from "../types";
import { buildSection } from "./sections";

const buildPhotos = (data: DoubanData): HTMLElement | null => {
  if (!data.photos?.length) {
    return null;
  }
  const carousel = el("div", { className: "atv-carousel atv-photos" });
  for (const p of data.photos) {
    const tile = el("div", { className: "atv-photo-tile" });
    tile.addEventListener("click", () => {
      openPosterModal(p.hdUrl || p.thumbUrl, "剧照");
    });
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
    img.addEventListener(
      "load",
      () => {
        if (img.naturalHeight > img.naturalWidth) {
          tile.classList.add("is-portrait");
        }
      },
      { once: true }
    );
    tile.append(img);
    carousel.append(tile);
  }
  const allHref = data.subjectId
    ? `https://movie.douban.com/subject/${data.subjectId}/all_photos`
    : "";
  return buildSection("atv-photos", "剧照", carousel, {
    moreLink: allHref ? { href: allHref, text: "查看全部 →" } : undefined,
  });
};

export { buildPhotos };
