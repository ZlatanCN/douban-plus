import type { McScoreSide } from "@/modules/subject/domain";

import { pagePath } from "./page-url";
import type { MetacriticTarget } from "./wikidata/claims";

type RatingSide =
  | { rating: McScoreSide; status: "matched" }
  | { status: "invalid"; reason: string }
  | { status: "no-rating" };

const countFromUserLink = (link: HTMLAnchorElement): number | null => {
  const countText = link.textContent?.match(
    /(?<count>\d[\d,]*)\s+User Ratings?/iu
  )?.groups?.count;
  if (!countText) {
    return null;
  }
  const count = Number(countText.replaceAll(",", ""));
  return Number.isSafeInteger(count) && count >= 0 ? count : null;
};

const isUserRatingsLink = (
  link: HTMLAnchorElement,
  target: MetacriticTarget,
  canonicalUrl: string
): boolean => {
  try {
    const url = new URL(link.getAttribute("href") ?? "", canonicalUrl);
    const canonicalPath = pagePath(canonicalUrl);
    let expectedPath: string | null = null;
    if (target.kind === "season" && target.seriesMetacriticId) {
      const seriesPath = pagePath(target.seriesMetacriticId);
      if (seriesPath) {
        expectedPath = `${seriesPath}/user-reviews`;
      }
    } else if (canonicalPath) {
      expectedPath = `${canonicalPath}/user-reviews`;
    }
    const seasonValues = url.searchParams.getAll("season");
    const seasonMatches =
      target.kind === "season"
        ? seasonValues.length === 1 &&
          seasonValues[0] === `season-${target.season}`
        : seasonValues.length === 0;
    return Boolean(
      url.protocol === "https:" &&
      (url.hostname === "www.metacritic.com" ||
        url.hostname === "metacritic.com") &&
      !url.username &&
      !url.password &&
      !url.hash &&
      url.pathname.replaceAll(/\/+$/gu, "") === expectedPath &&
      seasonMatches
    );
  } catch {
    return false;
  }
};

type VisibleUserScore =
  | { displayScore: string; score: number; status: "matched" }
  | { status: "no-rating" }
  | { reason: string; status: "invalid" };

const readVisibleUserScore = (
  valueWrapper: HTMLElement | null
): VisibleUserScore => {
  if (!valueWrapper) {
    return { reason: "unknown-user-score-state", status: "invalid" };
  }
  const tbd = valueWrapper.querySelector('[data-testid="global-score-tbd"]');
  const scoreValue = valueWrapper.querySelector(
    '[data-testid="global-score-value"]'
  );
  if (tbd && scoreValue) {
    return { reason: "conflicting-user-score-state", status: "invalid" };
  }
  if (tbd && tbd.textContent?.trim().toLowerCase() === "tbd") {
    return { status: "no-rating" };
  }
  if (!scoreValue) {
    return { reason: "unknown-user-score-state", status: "invalid" };
  }

  const scoreText = scoreValue.textContent?.trim() ?? "";
  const labels = [
    valueWrapper.getAttribute("aria-label"),
    valueWrapper.title,
  ].filter((label): label is string => Boolean(label));
  const score = Number(scoreText);
  if (
    !/^\d+(?:\.\d+)?$/u.test(scoreText) ||
    labels.length === 0 ||
    labels.some((label) => {
      const labelScore = label.match(
        /^User score (?<score>\d+(?:\.\d+)?) out of 10$/u
      )?.groups?.score;
      return labelScore === undefined || Number(labelScore) !== score;
    }) ||
    !Number.isFinite(score) ||
    score < 0 ||
    score > 10
  ) {
    return { reason: "invalid-user-score", status: "invalid" };
  }
  return { displayScore: scoreText, score, status: "matched" };
};

const readUserScoreCard = (
  card: HTMLElement,
  target: MetacriticTarget,
  canonicalUrl: string
): RatingSide => {
  const value = readVisibleUserScore(
    card.querySelector<HTMLElement>(
      '[data-testid="global-score-value-wrapper"]'
    )
  );
  if (value.status !== "matched") {
    return value;
  }

  const link = card.querySelector<HTMLAnchorElement>(
    'a[data-testid="global-score-review-count-link"]'
  );
  if (
    !link?.getAttribute("href") ||
    !isUserRatingsLink(link, target, canonicalUrl)
  ) {
    return { reason: "user-score-identity", status: "invalid" };
  }
  return {
    rating: {
      displayScore: value.displayScore,
      reviewCount: countFromUserLink(link),
      score: value.score,
    },
    status: "matched",
  };
};

const readUserScore = (
  html: string,
  target: MetacriticTarget,
  canonicalUrl: string
): RatingSide => {
  const page = new DOMParser().parseFromString(html, "text/html");
  const cards = [
    ...page.querySelectorAll<HTMLElement>(
      '[data-testid="global-score-wrapper"]'
    ),
  ].filter(
    (card) =>
      card
        .querySelector('[data-testid="global-score-header"]')
        ?.textContent?.trim() === "User score"
  );
  if (cards.length === 0) {
    return { reason: "missing-user-score", status: "invalid" };
  }
  const results = cards.map((card) =>
    readUserScoreCard(card, target, canonicalUrl)
  );
  if (results.some((result) => result.status === "invalid")) {
    const invalid = results.find((result) => result.status === "invalid");
    return invalid ?? { reason: "invalid-user-score", status: "invalid" };
  }
  const identities = new Set(
    results.map((result) =>
      result.status === "matched"
        ? JSON.stringify([
            result.rating.score,
            result.rating.displayScore,
            result.rating.reviewCount,
          ])
        : "no-rating"
    )
  );
  if (identities.size !== 1) {
    return { reason: "conflicting-user-score-regions", status: "invalid" };
  }
  return results[0] ?? { reason: "missing-user-score", status: "invalid" };
};

export { readUserScore, type RatingSide };
