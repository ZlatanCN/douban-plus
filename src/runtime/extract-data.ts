import {
  extractAwards,
  extractCelebrities,
  extractComments,
  extractInfo,
  extractInterestState,
  extractPhotos,
  extractPoster,
  extractRating,
  extractRecommendations,
  extractReviews,
  extractSeries,
  extractStreaming,
  extractSubjectId,
  extractSummary,
  extractTitle,
  extractTrailers,
  extractYear,
} from "../extract";
import type { DoubanData } from "../types";

const isTVInfo = (info: DoubanData["info"]): boolean =>
  !!(info.episodes || info.seasons || info.episodeRuntime || info.firstAired);

const extractDoubanData = (doc: Document): DoubanData => {
  const info = extractInfo(doc);
  const isTV = isTVInfo(info);

  return {
    awards: extractAwards(doc),
    celebrities: extractCelebrities(doc),
    comments: extractComments(doc),
    info,
    interest: extractInterestState(doc),
    isTV,
    photos: extractPhotos(doc),
    poster: extractPoster(doc),
    rating: extractRating(doc),
    recommendations: extractRecommendations(doc),
    reviews: extractReviews(doc),
    series: extractSeries(doc),
    streaming: extractStreaming(doc),
    subjectId: extractSubjectId(doc),
    summary: extractSummary(doc),
    title: extractTitle(doc),
    trailers: extractTrailers(doc),
    year: extractYear(doc),
  };
};

export { extractDoubanData };
