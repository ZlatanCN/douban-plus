import type { RtCount, RtRating } from "@/modules/subject/domain";

import { scorecardIdentityStatus } from "./rotten-parser";
import type { ScorecardInput } from "./rotten-parser";
import { readStructuredPage } from "./structured-page";

type RatingSide = {
  bandedRatingCount?: unknown;
  ratingCount?: unknown;
  scorePercent?: unknown;
};
type AudienceOverlay = {
  audienceAll?: RatingSide | null;
  audienceVerified?: RatingSide | null;
  hasAudienceAll?: boolean;
  hasAudienceVerified?: boolean;
};
type Scorecard = {
  audienceScore?: (RatingSide & Record<string, unknown>) | null;
  hideAudienceScore?: boolean;
  overlay?: AudienceOverlay;
  criticsScore?: RatingSide | null;
};
type ScorecardParseResult =
  | { rating: RtRating; status: "matched" }
  | { status: "identity-conflict" }
  | { status: "invalid-page" }
  | { status: "no-rating" };

const scoreValue = (value: unknown): number | null => {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }
  if (typeof value === "string" && !value.trim()) {
    return null;
  }
  const match = String(value)
    .trim()
    .match(/^(?<score>\d{1,3}(?:\.\d+)?)\s*%?$/u);
  if (!match) {
    return null;
  }
  const score = Number(match.groups?.score);
  return Number.isFinite(score) && score >= 0 && score <= 100 ? score : null;
};

const countValue = (value: unknown): RtCount | null => {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value >= 0
      ? { kind: "exact", value }
      : null;
  }
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  if (/\b(?:fewer|less) than\b/iu.test(value)) {
    return null;
  }
  const match = value
    .replaceAll(",", "")
    .match(/(?:^|\s)(?<count>\d+)(?<plus>\+)?(?:\s|$)/u);
  const rawCount = match?.groups?.count;
  if (!rawCount) {
    return null;
  }
  const count = Number(rawCount);
  if (!Number.isSafeInteger(count) || count < 0) {
    return null;
  }
  return match.groups?.plus
    ? { kind: "range", lowerBound: count }
    : { kind: "exact", value: count };
};

const sameCount = (left: unknown, right: unknown): boolean => {
  const leftCount = countValue(left);
  const rightCount = countValue(right);
  if (!leftCount && !rightCount) {
    return true;
  }
  return Boolean(
    leftCount &&
    rightCount &&
    leftCount.kind === rightCount.kind &&
    (leftCount.kind === "exact"
      ? rightCount.kind === "exact" && leftCount.value === rightCount.value
      : rightCount.kind === "range" &&
        leftCount.lowerBound === rightCount.lowerBound)
  );
};

const audienceGroup = (scorecard: Scorecard): "all" | "verified" | null => {
  const audience = scorecard.audienceScore;
  if (!audience || scorecard.hideAudienceScore) {
    return null;
  }
  const defaultScore = scoreValue(audience.scorePercent);
  if (defaultScore === null) {
    return null;
  }
  const defaultCount = audience.bandedRatingCount ?? audience.ratingCount;
  const { overlay } = scorecard;
  const candidates = [
    ...(overlay?.hasAudienceAll && overlay.audienceAll
      ? ([{ group: "all" as const, score: overlay.audienceAll }] as const)
      : []),
    ...(overlay?.hasAudienceVerified && overlay.audienceVerified
      ? ([
          { group: "verified" as const, score: overlay.audienceVerified },
        ] as const)
      : []),
  ].filter(
    ({ score }) =>
      scoreValue(score.scorePercent) === defaultScore &&
      sameCount(score.bandedRatingCount ?? score.ratingCount, defaultCount)
  );
  return candidates.length === 1 ? (candidates[0]?.group ?? null) : null;
};

const readScorecard = (html: string): Scorecard | null => {
  const script = html.match(
    /<script\b(?=[^>]*\bdata-json=["']mediaScorecard["'])[^>]*>(?<body>[\s\S]*?)<\/script>/iu
  )?.groups?.body;
  if (!script) {
    return null;
  }
  try {
    return JSON.parse(script.trim()) as Scorecard;
  } catch {
    return null;
  }
};

const buildRating = (
  data: Scorecard,
  input: ScorecardInput,
  sourceUrl: string
): RtRating | null => {
  const critics = data.criticsScore;
  const audience = data.audienceScore;
  const criticsScore = scoreValue(critics?.scorePercent);
  const audienceHidden =
    data.hideAudienceScore === true ||
    audience?.hidden === true ||
    audience?.isHidden === true;
  const audienceScore = audienceHidden
    ? null
    : scoreValue(audience?.scorePercent);
  const hasAudienceScore = audienceScore !== null;
  const group = hasAudienceScore ? audienceGroup(data) : null;
  if (criticsScore === null && audienceScore === null) {
    return null;
  }
  return {
    audienceCount: hasAudienceScore
      ? countValue(audience?.bandedRatingCount ?? audience?.ratingCount)
      : null,
    audienceGroup: group,
    audienceScore,
    criticsCount: countValue(
      critics?.ratingCount ?? critics?.bandedRatingCount
    ),
    criticsScore,
    fetchedAt: input.fetchedAt,
    object: { kind: input.kind, rtId: input.rtId, subjectId: input.subjectId },
    sourceUrl,
    stale: false,
  };
};

const parseScorecard = (
  html: string,
  input: ScorecardInput
): ScorecardParseResult => {
  const page = readStructuredPage(html);
  const identity = scorecardIdentityStatus(page, html, input);
  if (identity === "identity-conflict") {
    return { status: identity };
  }
  if (identity === "invalid-page" || !page.canonicalUrl) {
    return { status: "invalid-page" };
  }
  const scorecard = readScorecard(html);
  if (!scorecard) {
    return { status: "invalid-page" };
  }
  const rating = buildRating(
    scorecard,
    input,
    new URL(page.canonicalUrl, input.url).href
  );
  return rating ? { rating, status: "matched" } : { status: "no-rating" };
};

export { parseScorecard };
