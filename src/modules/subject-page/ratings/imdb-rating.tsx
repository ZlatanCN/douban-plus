import { Stars } from "../../../components/common/stars";
import type { ImdbRating as ImdbRatingData } from "../../../types";
import { ratingStateClass } from "./rating-helpers";
import { RatingLogo } from "./rating-logo";

type ImdbRatingProps = {
  rating: ImdbRatingData | null;
  resolved: boolean;
};

const renderImdbContent = (
  rating: ImdbRatingData | null,
  resolved: boolean
) => {
  if (rating) {
    return (
      <>
        <div class="atv-rating-panel-score">{rating.score.toFixed(1)}</div>
        <Stars score={rating.score} />
        <div class="atv-rating-panel-count">
          {rating.count
            ? `评价 ${rating.count.toLocaleString("en-US")}`
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

const ImdbRating = ({ rating, resolved }: ImdbRatingProps) => (
  <div
    class={`atv-rating-panel-imdb ${ratingStateClass(Boolean(rating), resolved)}`}
  >
    <RatingLogo name="imdb" />
    {renderImdbContent(rating, resolved)}
  </div>
);

export { ImdbRating };
export type { ImdbRatingProps };
