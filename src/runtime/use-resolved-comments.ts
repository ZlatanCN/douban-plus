import { useEffect, useMemo, useState } from "preact/hooks";

import type { Comment } from "@/types";
import { createCache } from "@/utils/cache";
import { gmGet } from "@/utils/request";

const avatarCache = createCache<string>("dp:avatar-cache", 30 * 60 * 1000);
const avatarSelectors = [
  "#profile .pic img",
  ".user-face",
  "img[src*='/icon/']",
];

const extractProfileAvatar = (html: string): string => {
  const profile = new DOMParser().parseFromString(html, "text/html");
  for (const selector of avatarSelectors) {
    const image = profile.querySelector<HTMLImageElement>(selector);
    if (!image) {
      continue;
    }
    const source =
      image.src || image.dataset.src || image.dataset.original || "";
    if (source) {
      return source;
    }
  }
  return "";
};

const profileLinks = (comments: Comment[]): string[] => [
  ...new Set(comments.flatMap(({ link }) => (link ? [link] : []))),
];

const fetchAvatarUrls = async (
  links: string[],
  referrer: string
): Promise<Map<string, string>> => {
  const urls = new Map<string, string>();
  const missing: string[] = [];
  for (const link of links) {
    const cached = avatarCache.get(link);
    if (cached) {
      urls.set(link, cached);
    } else {
      missing.push(link);
    }
  }
  if (missing.length === 0) {
    return urls;
  }

  const fetched = await Promise.all(
    missing.map(async (link) => {
      try {
        return { link, url: extractProfileAvatar(await gmGet(link, referrer)) };
      } catch {
        return { link, url: "" };
      }
    })
  );
  for (const { link, url } of fetched) {
    if (url) {
      avatarCache.set(link, url);
    }
    urls.set(link, url);
  }
  return urls;
};

const useResolvedComments = (comments: Comment[], doc: Document): Comment[] => {
  const [urls, setUrls] = useState<Map<string, string>>(() => new Map());

  useEffect(() => {
    let active = true;
    const links = profileLinks(comments);
    if (links.length === 0) {
      setUrls(new Map());
      return () => {
        active = false;
      };
    }

    void (async () => {
      const nextUrls = await fetchAvatarUrls(links, doc.location.href);
      if (active) {
        setUrls(nextUrls);
      }
    })();
    return () => {
      active = false;
    };
  }, [comments, doc]);

  return useMemo(
    () =>
      comments.map((comment) => ({
        ...comment,
        avatar: urls.get(comment.link) || comment.avatar,
      })),
    [comments, urls]
  );
};

export { useResolvedComments };
