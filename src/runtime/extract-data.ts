import { extractAwards } from "@/extract/awards";
import {
  extractPoster,
  extractSubjectId,
  extractTitle,
  extractYear,
} from "@/extract/basic";
import { extractInfo } from "@/extract/info";
import { extractInterestState } from "@/extract/interest";
import {
  extractCelebrities,
  extractPhotos,
  extractTrailers,
} from "@/extract/media";
import { extractRating, extractSummary } from "@/extract/rating";
import { extractReviews } from "@/extract/reviews";
import { extractSeries } from "@/extract/series";
import { extractComments, extractRecommendations } from "@/extract/social";
import { extractStreaming } from "@/extract/streaming";
import type { DoubanData } from "@/types";

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
