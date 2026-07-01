import { el, openPosterModal, openVideoModal } from "../components";
import type { DoubanData } from "../types";
import { buildSection } from "./sections";

const buildPhotos = (data: DoubanData): HTMLElement | null => {
  if (!data.photos?.length && !data.trailers?.length) {
    return null;
  }
  const carousel = el("div", { className: "atv-carousel atv-photos" });
  for (const t of data.trailers) {
    const tile = el("div", { className: "atv-photo-tile atv-trailer-tile" });
    tile.style.backgroundImage = `url("${t.thumbUrl}")`;
    tile.style.backgroundSize = "cover";
    tile.style.backgroundPosition = "center";
    tile.addEventListener("click", () => openVideoModal(t));

    const playOverlay = el("div", { className: "atv-trailer-play-overlay" });
    const playBtn = el("div", { className: "atv-trailer-play-btn" });
    playBtn.innerHTML =
      '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3" fill="white" stroke="none"/></svg>';
    playOverlay.append(playBtn);
    tile.append(playOverlay);

    const label = el("span", {
      className: "atv-trailer-label",
      text: t.title || "预告片",
    });
    tile.append(label);

    carousel.append(tile);
  }
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
