import type { WebLink } from "@/modules/movie-home/domain";

const MOVIE_HOME_URL = "https://movie.douban.com/";

const textOf = (node: Element | null): string =>
  node?.textContent?.trim() ?? "";

const hrefValueOf = (value: string | null | undefined): string | null => {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  const url = new URL(normalized, MOVIE_HOME_URL);
  return url.protocol === "https:" || url.protocol === "http:"
    ? url.href
    : null;
};

const hrefOf = (node: Element | null): string | null =>
  hrefValueOf(node?.getAttribute("href"));

const linkOf = (node: Element | null): WebLink | null => {
  const href = hrefOf(node);
  const label = textOf(node);
  return href && label ? { href, label } : null;
};

const imageOf = (scope: Element): string | null =>
  scope.querySelector("img")?.dataset.original?.trim() ||
  scope.querySelector("img")?.getAttribute("src")?.trim() ||
  null;

const invalidSection = (message: string): never => {
  throw new Error(`[ATV-Douban] ${message}`);
};

export {
  MOVIE_HOME_URL,
  hrefOf,
  hrefValueOf,
  imageOf,
  invalidSection,
  linkOf,
  textOf,
};
