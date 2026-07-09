import type { JSX } from "preact";

import { IconPopcorn, IconTomato } from "@/components/common/icons";
import type { RtRating } from "@/types";

import { isFresh, ratingStateClass } from "./rating-helpers";
import { RatingLogo } from "./rating-logo";

type RottenTomatoesRatingProps = {
  rating: RtRating | null;
  resolved: boolean;
};

const RtLabel = ({
  className,
  icon,
  score,
  text,
}: {
  className: string;
  icon: JSX.Element;
  score: number;
  text: string;
}) => (
  <span
    class={`atv-rt-label-item ${className} ${
      isFresh(score) ? "is-fresh" : "is-rotten"
    }`}
  >
    <span class="atv-rt-score-icon">{icon}</span>
    <span class="atv-rt-score-label">{text}</span>
  </span>
);

const renderRottenTomatoesContent = (
  rating: RtRating | null,
  resolved: boolean
) => {
  if (rating) {
    return (
      <>
        <div class="atv-rt-score-row">
          <div
            class={`atv-rt-score-value ${
              isFresh(rating.criticsScore) ? "is-fresh" : "is-rotten"
            }`}
          >
            {`${rating.criticsScore}%`}
          </div>
          <div class="atv-rt-divider" />
          <div
            class={`atv-rt-score-value ${
              isFresh(rating.audienceScore) ? "is-fresh" : "is-rotten"
            }`}
          >
            {`${rating.audienceScore}%`}
          </div>
        </div>
        <div class="atv-rt-label-row">
          <RtLabel
            className="is-critics"
            icon={<IconTomato />}
            score={rating.criticsScore}
            text="影评人"
          />
          <RtLabel
            className="is-audience"
            icon={<IconPopcorn />}
            score={rating.audienceScore}
            text="观众"
          />
        </div>
        <div class="atv-rt-count-row">
          <span class="atv-rt-count-value">
            {`评价 ${rating.criticsCount.toLocaleString("en-US")}`}
          </span>
          <span class="atv-rt-count-value">
            {`评价 ${rating.audienceCount.toLocaleString("en-US")}`}
          </span>
        </div>
      </>
    );
  }
  if (resolved) {
    return null;
  }
  return <div class="atv-rating-panel-skeleton" />;
};

const RottenTomatoesRating = ({
  rating,
  resolved,
}: RottenTomatoesRatingProps) => (
  <div
    class={`atv-rating-panel-rt ${ratingStateClass(Boolean(rating), resolved)}`}
  >
    <RatingLogo name="rt" />
    {renderRottenTomatoesContent(rating, resolved)}
  </div>
);

export { RottenTomatoesRating };
export type { RottenTomatoesRatingProps };
