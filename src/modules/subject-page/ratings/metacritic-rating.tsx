import type { McRating } from "@/types";

import {
  mcWordRatingChinese,
  ratingStateClass,
  scoreClass,
} from "./rating-helpers";
import { RatingLogo } from "./rating-logo";

type MetacriticRatingProps = {
  rating: McRating | null;
  resolved: boolean;
};

const renderMetacriticContent = (
  rating: McRating | null,
  resolved: boolean
) => {
  if (rating) {
    return (
      <>
        <div class={`atv-rating-panel-score ${scoreClass(rating.score)}`}>
          {String(rating.score)}
        </div>
        <div class="atv-mc-label-row">
          <span class="atv-mc-bar-track">
            <span
              class={`atv-mc-bar-fill ${scoreClass(rating.score)}`}
              style={{ width: `${Math.min(100, rating.score)}%` }}
            />
          </span>
          <span class="atv-mc-word-label">
            {mcWordRatingChinese(rating.score)}
          </span>
        </div>
        <div class="atv-rating-panel-count">
          {rating.reviewCount
            ? `评价 ${rating.reviewCount.toLocaleString("en-US")}`
            : "已评分"}
        </div>
      </>
    );
  }
  if (resolved) {
    return null;
  }
  return <div class="atv-rating-panel-skeleton" />;
};

const MetacriticRating = ({ rating, resolved }: MetacriticRatingProps) => (
  <div
    class={`atv-rating-panel-mc ${ratingStateClass(Boolean(rating), resolved)}`}
  >
    <RatingLogo name="metacritic" />
    {renderMetacriticContent(rating, resolved)}
  </div>
);

export { MetacriticRating };
export type { MetacriticRatingProps };
