import { el } from "../../components";
import type { HeroData, Photo } from "../../types";
import { hashStr } from "../../utils/hash";

/* ── pickStill — deterministic still from photos ───────── */

const pickStill = (photos: Photo[], seed: string): Photo | null => {
  if (!photos?.length) {
    return null;
  }
  const idx = hashStr(String(seed || "")) % photos.length;
  return photos[idx];
};

/* ── buildHeroBg — gradient overlay + blurred still ───── */

const buildHeroBg = (data: HeroData): HTMLElement => {
  const bg = el("div", { className: "atv-hero-bg" });
  const still = pickStill(data.photos, data.subjectId);

  if (still?.hdUrl) {
    const thumb = el("div", { className: "atv-hero-still is-thumb" });
    thumb.style.backgroundImage = `url("${still.thumbUrl || still.hdUrl}")`;
    bg.append(thumb);

    const hd = el("div", { className: "atv-hero-still is-hd" });
    hd.setAttribute("aria-hidden", "true");
    bg.append(hd);

    const loader = new Image();
    loader.addEventListener(
      "load",
      () => {
        hd.style.backgroundImage = `url("${still.hdUrl}")`;
        requestAnimationFrame(() => hd.classList.add("is-loaded"));
      },
      { once: true }
    );
    loader.addEventListener(
      "error",
      (e) => {
        console.error("[Hero] HD still FAILED:", still.hdUrl, e);
        if (still.thumbUrl && still.thumbUrl !== still.hdUrl) {
          hd.style.backgroundImage = `url("${still.thumbUrl}")`;
          requestAnimationFrame(() => hd.classList.add("is-loaded"));
        }
      },
      { once: true }
    );
    loader.src = still.hdUrl;
    return bg;
  }

  if (data.poster) {
    const poster = el("div", { className: "atv-hero-still is-poster" });
    poster.style.backgroundImage = `url("${data.poster}")`;
    bg.append(poster);
    return bg;
  }

  bg.style.background =
    "radial-gradient(circle at 30% 30%, #2c2c2e 0%, #000 70%)";
  return bg;
};

export { pickStill, buildHeroBg };
