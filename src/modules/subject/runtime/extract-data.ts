import type { DoubanData } from "@/modules/subject/domain";
import { extractAwards } from "@/modules/subject/extract/awards";
import {
  extractPoster,
  extractSubjectId,
  extractTitle,
  extractYear,
} from "@/modules/subject/extract/basic";
import { extractDiscussions } from "@/modules/subject/extract/discussions";
import { extractInfo } from "@/modules/subject/extract/info";
import { extractInterestState } from "@/modules/subject/extract/interest";
import {
  extractCelebrities,
  extractPhotos,
  extractTrailers,
} from "@/modules/subject/extract/media";
import { extractRankLabel } from "@/modules/subject/extract/rank-label";
import {
  extractRating,
  extractSummary,
} from "@/modules/subject/extract/rating";
import { extractReviews } from "@/modules/subject/extract/reviews";
import { extractSeries } from "@/modules/subject/extract/series";
import {
  extractComments,
  extractRecommendations,
} from "@/modules/subject/extract/social";
import { extractStreaming } from "@/modules/subject/extract/streaming";

const isTVInfo = (info: DoubanData["info"]): boolean =>
  !!(info.episodes || info.seasons || info.episodeRuntime || info.firstAired);

const extractDoubanData = (doc: Document): DoubanData => {
  const info = extractInfo(doc);
  const isTV = isTVInfo(info);

  return {
    awards: extractAwards(doc),
    celebrities: extractCelebrities(doc),
    comments: extractComments(doc),
    discussions: extractDiscussions(doc),
    info,
    interest: extractInterestState(doc),
    isTV,
    photos: extractPhotos(doc),
    poster: extractPoster(doc),
    rankLabel: extractRankLabel(doc),
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
