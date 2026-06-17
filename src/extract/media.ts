/* ── Media Extractors ──────────────────────────────────── */
/* Celebrities (cast/crew) and photo gallery.              */

import { RE_BG_URL } from "../constants";
import type { Celebrity, Photo } from "../types";
import { $, $$, safeText } from "../utils/dom";
import { upgradePhoto } from "../utils/upgrade";

/**
 * Extract cast/crew from the "#celebrities" list.
 * Iterates `.celebrity` items and pulls name, role, avatar (from background),
 * and profile link.
 */
function extractCelebrities(): Celebrity[] {
  return $$<HTMLLIElement>("#celebrities li.celebrity")
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
          avatar = m[1];
        }
      }
      return {
        name: safeText(nameEl),
        role: safeText(roleEl),
        avatar,
        link:
          nameEl && nameEl.tagName === "A"
            ? (nameEl as HTMLAnchorElement).href
            : "",
      };
    })
    .filter((c) => c.name);
}

/**
 * Extract photo gallery from "#related-pic" section.
 * Finds `<img>` inside `.related-pic-bd`, extracts thumb/HD/link.
 */
function extractPhotos(): Photo[] {
  return $$<HTMLImageElement>("#related-pic .related-pic-bd img")
    .map((img) => {
      const thumb =
        (img as HTMLImageElement).src || img.getAttribute("data-src") || "";
      const a = img.closest("a");
      return {
        thumbUrl: thumb,
        hdUrl: upgradePhoto(thumb) || "",
        link: a ? (a as HTMLAnchorElement).href : "",
      };
    })
    .filter((p) => p.thumbUrl);
}

/* ── Exports ──────────────────────────────────────────── */

export { extractCelebrities, extractPhotos };
