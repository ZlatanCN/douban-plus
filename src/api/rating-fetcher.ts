import type { Cache } from "@/utils/cache";
import { gmGet } from "@/utils/request";

type RatingUrlContext = {
  isTV: boolean;
  season?: number;
  slug: string;
  year?: string;
};

type RatingFetcherConfig<T> = {
  cache: Cache<T>;
  parse: (html: string) => T | null;
  referer: string;
  slugSeparator: "-" | "_";
  urls: (ctx: RatingUrlContext) => string[];
};

type RatingFetcher<T> = (
  title: string,
  isTV?: boolean,
  season?: number,
  year?: string
) => Promise<T | null>;

const toRatingSlug = (title: string, separator: "-" | "_"): string =>
  title
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036F]/gu, "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, separator)
    .replaceAll(separator === "-" ? /^-|-$/gu : /^_|_$/gu, "");

const createRatingCacheKey = (
  slug: string,
  separator: "-" | "_",
  season?: number,
  year?: string
): string => {
  let key = slug;
  if (year) {
    key = `${key}${separator}${year}`;
  }
  if (season) {
    key = `${key}-s${String(season).padStart(2, "0")}`;
  }
  return key;
};

const createRatingFetcher =
  <T>({
    cache,
    parse,
    referer,
    slugSeparator,
    urls,
  }: RatingFetcherConfig<T>): RatingFetcher<T> =>
  async (title, isTV, season, year) => {
    if (!title) {
      return null;
    }

    const slug = toRatingSlug(title, slugSeparator);
    if (!slug) {
      return null;
    }

    const key = createRatingCacheKey(slug, slugSeparator, season, year);
    const cached = cache.get(key);
    if (cached) {
      return cached;
    }

    for (const url of urls({
      isTV: Boolean(isTV),
      ...(season === undefined ? {} : { season }),
      slug,
      ...(year === undefined ? {} : { year }),
    })) {
      try {
        // oxlint-disable-next-line no-await-in-loop
        const html = await gmGet(url, referer);
        const rating = parse(html);
        if (rating) {
          cache.set(key, rating);
          return rating;
        }
      } catch {
        /* continue to fallback URL */
      }
    }
    return null;
  };

export { createRatingFetcher };
export type { RatingFetcher, RatingFetcherConfig, RatingUrlContext };
