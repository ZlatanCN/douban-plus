import type { WebLink } from "@/modules/movie-home/domain";

const MOVIE_HOME_URL = "https://movie.douban.com/";

type NativeLinkTarget =
  | "douban"
  | "douban-doulist"
  | "douban-person"
  | "movie"
  | "movie-review"
  | "movie-subject"
  | "movie-ticket"
  | "search";

const isDoubanHost = (hostname: string): boolean =>
  hostname === "douban.com" || hostname.endsWith(".douban.com");

const isValidNativeTarget = (url: URL, target: NativeLinkTarget): boolean => {
  if (url.protocol !== "https:") {
    return false;
  }

  switch (target) {
    case "search": {
      return (
        url.hostname === "search.douban.com" &&
        url.pathname === "/movie/subject_search"
      );
    }
    case "movie-subject": {
      return (
        url.hostname === "movie.douban.com" &&
        /^\/subject\/\d+\/?$/u.test(url.pathname)
      );
    }
    case "movie-ticket": {
      return (
        url.hostname === "movie.douban.com" &&
        url.pathname === "/ticket/redirect/" &&
        /^\d+$/u.test(url.searchParams.get("movie_id") ?? "")
      );
    }
    case "douban-doulist": {
      return (
        url.hostname === "www.douban.com" &&
        /^\/doulist\/\d+\/?$/u.test(url.pathname)
      );
    }
    case "douban-person": {
      return (
        url.hostname === "www.douban.com" &&
        /^\/people\/[^/]+\/?$/u.test(url.pathname)
      );
    }
    case "movie-review": {
      return (
        url.hostname === "movie.douban.com" &&
        /^\/review\/\d+\/?$/u.test(url.pathname)
      );
    }
    case "movie": {
      return url.hostname === "movie.douban.com";
    }
    case "douban": {
      return isDoubanHost(url.hostname);
    }
    default: {
      return false;
    }
  }
};

const hrefValueOf = (
  value: string | null | undefined,
  target: NativeLinkTarget
): string | null => {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  try {
    const url = new URL(normalized, MOVIE_HOME_URL);
    return isValidNativeTarget(url, target) ? url.href : null;
  } catch {
    return null;
  }
};

const hrefOf = (
  node: Element | null,
  target: NativeLinkTarget
): string | null => hrefValueOf(node?.getAttribute("href"), target);

const textOf = (node: Element | null): string =>
  node?.textContent?.trim() ?? "";

const linkOf = (
  node: Element | null,
  target: NativeLinkTarget
): WebLink | null => {
  const href = hrefOf(node, target);
  const label = textOf(node);
  return href && label ? { href, label } : null;
};

const imageValueOf = (value: string | null | undefined): string | null => {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  try {
    const url = new URL(normalized, MOVIE_HOME_URL);
    const isDoubanImageHost =
      url.hostname === "doubanio.com" ||
      url.hostname.endsWith(".doubanio.com") ||
      url.hostname === "douban.com" ||
      url.hostname.endsWith(".douban.com");
    return url.protocol === "https:" && isDoubanImageHost ? url.href : null;
  } catch {
    return null;
  }
};

const imageOf = (scope: Element): string | null => {
  const image = scope.querySelector("img");
  return imageValueOf(
    image?.dataset.original?.trim() || image?.getAttribute("src")
  );
};

const throwExtractionFailure = (message: string): never => {
  throw new Error(`[ATV-Douban] ${message}`);
};

const completeItems = <Item>(
  items: (Item | null)[],
  message: string
): Item[] => {
  if (items.some((item) => item === null)) {
    return throwExtractionFailure(message);
  }
  return items.filter((item): item is Item => item !== null);
};

export {
  MOVIE_HOME_URL,
  completeItems,
  hrefOf,
  hrefValueOf,
  imageOf,
  linkOf,
  textOf,
  throwExtractionFailure,
};
