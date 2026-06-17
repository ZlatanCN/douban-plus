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
        avatar,
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
        thumbUrl: thumb,
      };
    })
    .filter((p) => p.thumbUrl);

/* ── Exports ──────────────────────────────────────────── */

export { extractCelebrities, extractPhotos };
