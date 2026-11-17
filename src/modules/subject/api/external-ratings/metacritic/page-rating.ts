import type { McScore } from "@/modules/subject/domain";

import type { StructuredPage } from "../shared/structured-page";
import { METACRITIC_ORIGIN } from "./page-url";
import { readUserScore } from "./page-user-score";
import type { RatingSide } from "./page-user-score";
import type { MetacriticTarget } from "./wikidata/claims";

type PageRating =
  | { rating: McScore; status: "matched" }
  | { rating: McScore; reason: string; status: "partial-error" }
  | { reason: string; status: "invalid-page" }
  | { status: "no-rating" };

const readCount = (value: unknown): number | null | false => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const text =
    typeof value === "string" ? value.replaceAll(",", "").trim() : value;
  const count = Number(text);
  return Number.isSafeInteger(count) && count >= 0 ? count : false;
};

const readMetascore = (entry: Record<string, unknown>): RatingSide => {
  const aggregate = entry.aggregateRating;
  if (aggregate === null || aggregate === undefined) {
    return { status: "no-rating" };
  }
  if (typeof aggregate !== "object") {
    return { reason: "invalid-metascore", status: "invalid" };
  }
  const value = Reflect.get(aggregate, "ratingValue");
  if (typeof value !== "number" && typeof value !== "string") {
    return { reason: "missing-metascore", status: "invalid" };
  }
  const displayScore = String(value).trim();
  if (!/^\d+$/u.test(displayScore)) {
    return { reason: "invalid-metascore", status: "invalid" };
  }
  const score = Number(displayScore);
  const reviewCount = readCount(Reflect.get(aggregate, "reviewCount"));
  if (
    !Number.isInteger(score) ||
    score < 0 ||
    score > 100 ||
    reviewCount === false
  ) {
    return { reason: "invalid-metascore", status: "invalid" };
  }
  return {
    rating: { displayScore, reviewCount, score },
    status: "matched",
  };
};

const readPageRating = (
  html: string,
  page: StructuredPage,
  target: MetacriticTarget,
  entry: Record<string, unknown>
): PageRating => {
  if (!page.canonicalUrl) {
    return { reason: "missing-canonical", status: "invalid-page" };
  }
  let audience: RatingSide;
  try {
    audience = readUserScore(html, target, page.canonicalUrl);
  } catch {
    audience = { reason: "user-score-parser", status: "invalid" };
  }
  const critics = readMetascore(entry);
  const sourceUrl = new URL(page.canonicalUrl, METACRITIC_ORIGIN).href;
  const rating: McScore = {
    audience: audience.status === "matched" ? audience.rating : null,
    critics: critics.status === "matched" ? critics.rating : null,
    sourceUrl,
  };
  const validSides =
    Number(rating.critics !== null) + Number(rating.audience !== null);
  const invalidSides = [critics, audience].filter(
    (side) => side.status === "invalid"
  );
  if (validSides === 0) {
    if (invalidSides.length > 0) {
      return {
        reason: invalidSides.map((side) => side.reason).join("+"),
        status: "invalid-page",
      };
    }
    return { status: "no-rating" };
  }
  if (invalidSides.length > 0) {
    return {
      rating,
      reason: invalidSides.map((side) => side.reason).join("+"),
      status: "partial-error",
    };
  }
  return { rating, status: "matched" };
};

export { readPageRating, type PageRating };
