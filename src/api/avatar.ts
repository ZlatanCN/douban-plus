import type { Comment } from "../types";
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

/* ── DOM Update (with preload + reveal) ──────────────── */

const updateAvatarDom = (url: string, selector: string, retries = 5): void => {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) {
    if (retries > 0) {
      requestAnimationFrame(() => updateAvatarDom(url, selector, retries - 1));
    }
    return;
  }

  const img = new Image();
  img.addEventListener("load", () => {
    el.style.backgroundImage = `url("${url}")`;
    el.textContent = "";
    el.classList.add("atv-avatar-loaded");
  });
  img.addEventListener("error", () => {
    console.warn("[AVATAR] preload FAILED for", url);
    // Keep fallback
  });
  img.src = url;
};

/* ── resolveCommentAvatars ───────────────────────────── */

const resolveCommentAvatars = async (comments: Comment[]): Promise<void> => {
  const pending = comments.filter((c) => c.link && !avatarCache.get(c.link));

  // Update DOM immediately for entries already in cache
  for (const c of comments) {
    const url = avatarCache.get(c.link);
    if (!url) {
      continue;
    }
    c.avatar = url;
    updateAvatarDom(
      url,
      `.atv-comment-card[data-cid="${c.cid}"] .atv-comment-avatar`
    );
    updateAvatarDom(url, `.atv-comment-overlay-avatar[data-cid="${c.cid}"]`);
  }

  if (pending.length === 0) {
    return;
  }

  const results = await Promise.allSettled(
    pending.map(async (c) => {
      const name = c.link.replace(/\/+$/u, "").split("/").pop() || "";
      try {
        const html = await gmGet(
          `https://www.douban.com/people/${name}/`,
          location.href
        );
        const avatar = extractProfileAvatar(html);
        return { link: c.link, url: avatar };
      } catch (error) {
        console.warn("[AVATAR] fetch FAILED for", name, error);
        return { link: c.link, url: "" };
      }
    })
  );

  let cachedCount = 0;
  for (const result of results) {
    if (result.status === "fulfilled") {
      const { link, url } = result.value;
      if (url) {
        avatarCache.set(link, url);
        cachedCount += 1;
      }
    }
  }

  // Update DOM for newly fetched avatars
  for (const c of comments) {
    const url = avatarCache.get(c.link);
    if (!url) {
      continue;
    }
    // c.avatar might already be set from the first loop (cached hit)
    if (c.avatar === url) {
      continue;
    }
    c.avatar = url;
    updateAvatarDom(
      url,
      `.atv-comment-card[data-cid="${c.cid}"] .atv-comment-avatar`
    );
    updateAvatarDom(url, `.atv-comment-overlay-avatar[data-cid="${c.cid}"]`);
  }
};

export { resolveCommentAvatars };
