/* ── Media Extractors ──────────────────────────────────── */
/* Celebrities (cast/crew) and photo gallery.              */

import { RE_BG_URL } from "@/modules/subject/constants";
import type { Celebrity, Photo, Trailer } from "@/modules/subject/domain";
import {
  thumbnailPhoto,
  upgradePhoto,
} from "@/modules/subject/extract/image-urls";
import { $, $$, safeText } from "@/shared/utils/dom";

/**
 * Extract cast/crew from the "#celebrities" list.
 * Iterates `.celebrity` items and pulls name, role, avatar (from background),
 * and profile link.
 */
const extractCelebrities = (doc: Document): Celebrity[] =>
  $$<HTMLLIElement>("#celebrities li.celebrity", doc)
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
          avatar = m[1] ?? "";
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
const extractPhotos = (doc: Document): Photo[] =>
  $$<HTMLImageElement>("#related-pic .related-pic-bd img", doc)
    .map((img) => {
      const thumb = (img as HTMLImageElement).src || img.dataset.src || "";
      const a = img.closest("a");
      return {
        hdUrl: upgradePhoto(thumb) || "",
        link: a ? (a as HTMLAnchorElement).href : "",
        thumbUrl: thumbnailPhoto(thumb) ?? "",
      };
    })
    .filter((p) => p.thumbUrl);

/**
 * Extract trailers from "#related-pic" section.
 * Finds `<a.related-pic-video>` inside `li.label-trailer`,
 * extracts trailer page URL, thumbnail from background-image, and title.
 */
const extractTrailers = (doc: Document): Trailer[] =>
  $$<HTMLAnchorElement>(
    "#related-pic li.label-trailer a.related-pic-video",
    doc
  )
    .map((a) => {
      const style = a.getAttribute("style") || "";
      const m = style.match(RE_BG_URL);
      const thumbUrl = m?.[1] ?? "";
      return {
        thumbUrl: encodeURI(thumbUrl),
        title: a.getAttribute("title") || "",
        trailerPageUrl: a.href,
      };
    })
    .filter((t) => t.trailerPageUrl);

/* ── Exports ──────────────────────────────────────────── */

export { extractCelebrities, extractPhotos, extractTrailers };
