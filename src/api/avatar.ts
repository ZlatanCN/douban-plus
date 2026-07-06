import { createCache } from "../utils/cache";
import { gmGet } from "../utils/request";

const avatarCache = createCache<string>("dp:avatar-cache", 30 * 60 * 1000);

/* ── Profile Page Parsing ────────────────────────────── */

const AVATAR_SELECTORS = [
  "#profile .pic img",
  ".user-face",
  "img[src*='/icon/']",
];

const extractProfileAvatar = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  for (const sel of AVATAR_SELECTORS) {
    const img = doc.querySelector<HTMLImageElement>(sel);
    if (!img) {
      continue;
    }
    const src = img.src || img.dataset.src || img.dataset.original || "";
    if (src) {
      return src;
    }
  }
  return "";
};

/* ── fetchAvatarUrls ─────────────────────────────────── */

const fetchAvatarUrls = async (
  links: string[]
): Promise<Map<string, string>> => {
  if (links.length === 0) {
    return new Map();
  }

  const result = new Map<string, string>();
  const missing: string[] = [];

  for (const link of links) {
    const cached = avatarCache.get(link);
    if (cached) {
      result.set(link, cached);
    } else {
      missing.push(link);
    }
  }

  if (missing.length === 0) {
    return result;
  }

  const fetchResults = await Promise.allSettled(
    missing.map(async (link) => {
      try {
        const html = await gmGet(link, location.href);
        return { link, url: extractProfileAvatar(html) };
      } catch {
        return { link, url: "" };
      }
    })
  );

  for (const fetchResult of fetchResults) {
    if (fetchResult.status === "fulfilled") {
      const { link, url } = fetchResult.value;
      if (url) {
        avatarCache.set(link, url);
      }
      result.set(link, url);
    }
  }

  return result;
};

export { fetchAvatarUrls };
