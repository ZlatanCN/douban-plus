import type {
  ExternalRatingDiagnostic,
  ExternalRatingReason,
} from "@/modules/subject/api/external-ratings/outcome";
import { createExternalRatingDiagnostic } from "@/modules/subject/api/external-ratings/outcome";
import type { ImdbRating } from "@/modules/subject/domain";
import { createCache } from "@/shared/utils/cache";

import { fetchSeasonRating, fetchTitleInfo } from "./query";
import type { TitleInfoResult } from "./query";

const imdbCache = createCache<{
  fetchedAt: number;
  rating: NonNullable<ImdbRating>;
  sourceUrl: string;
  title: string;
}>("dp:imdb-cache-v4", 30 * 24 * 60 * 60 * 1000);

type FetchImdbResult = {
  rating: ImdbRating | null;
  sourceUrl: string | null;
  title: string | null;
};
type OnImdbOutcome = (diagnostic: ExternalRatingDiagnostic) => void;

const makeDiagnostic = (
  reason: ExternalRatingReason,
  stage: ExternalRatingDiagnostic["stage"],
  target: string | null,
  cacheAgeMs: number | null = null,
  errorCode: string | null = null
): ExternalRatingDiagnostic =>
  createExternalRatingDiagnostic({
    cacheAgeMs,
    errorCode,
    reason,
    stage,
    target,
  });

const seasonCacheKey = (titleId: string, season: number): string =>
  `${titleId}-s${String(season).padStart(2, "0")}`;

const imdbTitleUrl = (titleId: string): string =>
  `https://www.imdb.com/title/${encodeURIComponent(titleId)}/`;

const imdbSeasonUrl = (seriesId: string, season: number): string =>
  `${imdbTitleUrl(seriesId)}episodes/?season=${season}`;

const cachedRating = (
  imdbId: string,
  entry: ReturnType<typeof imdbCache.get>,
  onOutcome?: OnImdbOutcome
): FetchImdbResult | null => {
  if (!entry) {
    return null;
  }
  onOutcome?.(
    makeDiagnostic(
      "rating",
      "cache",
      imdbId,
      Number.isFinite(entry.fetchedAt)
        ? Math.max(0, Date.now() - entry.fetchedAt)
        : null
    )
  );
  return {
    rating: entry.rating,
    sourceUrl: entry.sourceUrl,
    title: entry.title,
  };
};

const diagnosticStage = (
  reason: ExternalRatingReason
): ExternalRatingDiagnostic["stage"] =>
  reason === "request-error" || reason === "cancelled" ? "request" : "parse";

const publishTitleFailure = (
  target: string,
  failure: Extract<TitleInfoResult, { errorCode: string }>,
  onOutcome?: OnImdbOutcome
): void => {
  onOutcome?.(
    makeDiagnostic(
      failure.reason,
      diagnosticStage(failure.reason),
      target,
      null,
      failure.errorCode
    )
  );
};

const fetchSeasonTitleRating = async (
  imdbId: string,
  season: number,
  signal: AbortSignal | undefined,
  onOutcome?: OnImdbOutcome
): Promise<FetchImdbResult> => {
  const cacheKey = seasonCacheKey(imdbId, season);
  const cached = cachedRating(imdbId, imdbCache.get(cacheKey), onOutcome);
  if (cached) {
    return cached;
  }

  const titleInfoResult = await fetchTitleInfo(imdbId, signal);
  if ("errorCode" in titleInfoResult) {
    publishTitleFailure(imdbId, titleInfoResult, onOutcome);
    return { rating: null, sourceUrl: null, title: null };
  }

  const { titleText, seriesInfo, titleTypeId } = titleInfoResult.response;
  const seriesId =
    seriesInfo?.id ?? (titleTypeId === "tvSeries" ? imdbId : null);
  if (seriesId === null) {
    onOutcome?.(
      makeDiagnostic(
        "mapping-missing",
        "mapping",
        imdbId,
        null,
        "season-parent-missing"
      )
    );
    return { rating: null, sourceUrl: null, title: titleText };
  }

  const seasonResult = await fetchSeasonRating(seriesId, season, signal);
  const title = seriesInfo?.titleText ?? titleText;
  const sourceUrl = imdbSeasonUrl(seriesId, season);
  if (seasonResult.status === "source-no-rating") {
    onOutcome?.(
      makeDiagnostic("source-no-rating", "rating", `${seriesId}-s${season}`)
    );
    return { rating: null, sourceUrl, title };
  }
  if (seasonResult.status !== "rating") {
    onOutcome?.(
      makeDiagnostic(
        seasonResult.status,
        diagnosticStage(seasonResult.status),
        `${seriesId}-s${season}`,
        null,
        seasonResult.errorCode
      )
    );
    return { rating: null, sourceUrl, title };
  }

  const cacheTitle = title ?? "";
  const fetchedAt = Date.now();
  imdbCache.set(cacheKey, {
    fetchedAt,
    rating: seasonResult.rating,
    sourceUrl,
    title: cacheTitle,
  });
  onOutcome?.(makeDiagnostic("rating", "rating", `${seriesId}-s${season}`, 0));
  return { rating: seasonResult.rating, sourceUrl, title: cacheTitle };
};

const fetchDirectTitleRating = async (
  imdbId: string,
  signal: AbortSignal | undefined,
  onOutcome?: OnImdbOutcome
): Promise<FetchImdbResult> => {
  const cached = cachedRating(imdbId, imdbCache.get(imdbId), onOutcome);
  if (cached) {
    return cached;
  }
  const titleInfoResult = await fetchTitleInfo(imdbId, signal);
  if ("errorCode" in titleInfoResult) {
    publishTitleFailure(imdbId, titleInfoResult, onOutcome);
    return { rating: null, sourceUrl: null, title: null };
  }

  const { aggregateRating, voteCount, titleText } = titleInfoResult.response;
  if (typeof aggregateRating !== "number" || typeof voteCount !== "number") {
    onOutcome?.(makeDiagnostic("source-no-rating", "rating", imdbId));
    return { rating: null, sourceUrl: imdbTitleUrl(imdbId), title: titleText };
  }
  const rating: NonNullable<ImdbRating> = {
    count: voteCount,
    score: aggregateRating,
  };
  const title = typeof titleText === "string" ? titleText : "";
  const sourceUrl = imdbTitleUrl(imdbId);
  imdbCache.set(imdbId, { fetchedAt: Date.now(), rating, sourceUrl, title });
  onOutcome?.(makeDiagnostic("rating", "rating", imdbId, 0));
  return { rating, sourceUrl, title };
};

const fetchImdbRating = (
  imdbId: string,
  season?: number,
  signal?: AbortSignal,
  onOutcome?: OnImdbOutcome
): Promise<FetchImdbResult> => {
  if (!imdbId) {
    onOutcome?.(
      makeDiagnostic("mapping-missing", "mapping", null, null, "no-imdb-id")
    );
    return Promise.resolve({ rating: null, sourceUrl: null, title: null });
  }
  if (signal?.aborted) {
    onOutcome?.(
      makeDiagnostic("cancelled", "request", imdbId, null, "aborted")
    );
    return Promise.resolve({ rating: null, sourceUrl: null, title: null });
  }
  return season === undefined
    ? fetchDirectTitleRating(imdbId, signal, onOutcome)
    : fetchSeasonTitleRating(imdbId, season, signal, onOutcome);
};

export { fetchImdbRating };
export type { FetchImdbResult, OnImdbOutcome };
