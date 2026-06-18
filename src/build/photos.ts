import { el, openPosterModal } from "../components";
import type { DoubanData } from "../types";
import { buildSectionHeaderRow } from "./sections";

const buildPhotos = (data: DoubanData): HTMLElement | null => {
  if (!data.photos?.length) {
    return null;
  }
  const sec = el("section", { className: "atv-section", id: "atv-photos" });
  const allHref = data.subjectId
    ? `https://movie.douban.com/subject/${data.subjectId}/all_photos`
    : "";
  sec.append(
    buildSectionHeaderRow("剧照", allHref ? "查看全部 →" : "", allHref)
  );
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
    tile.append(img);
    carousel.append(tile);
  }
  sec.append(carousel);
  return sec;
};

export { buildPhotos };
