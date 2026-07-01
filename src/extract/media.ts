/* ── Media Extractors ──────────────────────────────────── */
/* Celebrities (cast/crew) and photo gallery.              */

import { RE_BG_URL } from "../constants";
import type { Celebrity, Photo, Trailer } from "../types";
import { $, $$, safeText } from "../utils/dom";
import { upgradePhoto } from "../utils/upgrade";

/**
 * Extract cast/crew from the "#celebrities" list.
 * Iterates `.celebrity` items and pulls name, role, avatar (from background),
 * and profile link.
 */
const extractCelebrities = (): Celebrity[] =>
  $$<HTMLLIElement>("#celebrities li.celebrity")
    .map((li) => {
      const nameEl =
        $<HTMLAnchorElement>(".info .name a", li) ??
        $<HTMLElement>(".info .name", li);
      const roleEl = $<HTMLElement>(".info .role", li);
      const avatarEl = $<HTMLElement>(".avatar", li);
      let avatar = "";
      if (avatarEl) {
        const bg = avatarEl.getAttribute("style") || "";
        const m = bg.match(RE_BG_URL);
        if (m) {
          [, avatar] = m;
        }
      }
      return {
        avatar: encodeURI(avatar),
        link:
          nameEl && nameEl.tagName === "A"
            ? (nameEl as HTMLAnchorElement).href
            : "",
        name: safeText(nameEl),
        role: safeText(roleEl),
      };
    })
    .filter((c) => c.name);

/**
 * Extract photo gallery from "#related-pic" section.
 * Finds `<img>` inside `.related-pic-bd`, extracts thumb/HD/link.
 */
const extractPhotos = (): Photo[] =>
  $$<HTMLImageElement>("#related-pic .related-pic-bd img")
    .map((img) => {
      const thumb = (img as HTMLImageElement).src || img.dataset.src || "";
      const a = img.closest("a");
      return {
        hdUrl: upgradePhoto(thumb) || "",
        link: a ? (a as HTMLAnchorElement).href : "",
        thumbUrl: encodeURI(thumb),
      };
    })
    .filter((p) => p.thumbUrl);

/**
 * Extract trailers from "#related-pic" section.
 * Finds `<a.related-pic-video>` inside `li.label-trailer`,
 * extracts trailer page URL, thumbnail from background-image, and title.
 */
const extractTrailers = (): Trailer[] =>
  $$<HTMLAnchorElement>("#related-pic li.label-trailer a.related-pic-video")
    .map((a) => {
      const style = a.getAttribute("style") || "";
      const m = style.match(RE_BG_URL);
      const thumbUrl = m ? m[1] : "";
      return {
        thumbUrl: encodeURI(thumbUrl),
        title: a.getAttribute("title") || "",
        trailerPageUrl: a.href,
      };
    })
    .filter((t) => t.trailerPageUrl);

/* ── Exports ──────────────────────────────────────────── */

export { extractCelebrities, extractPhotos, extractTrailers };
