import type { RatingInfo } from "@/modules/subject/domain";
import { Stars } from "@/shared/components/common/stars";

import { RatingLogo } from "./rating-logo";

type DoubanRatingProps = {
  rating: RatingInfo | null;
};

const DoubanRating = ({ rating }: DoubanRatingProps) => (
  <div class="atv-rating-panel-douban">
    <RatingLogo name="douban" />
    {rating ? (
      <>
        <div class="atv-rating-panel-score">{rating.score.toFixed(1)}</div>
        <Stars score={rating.score} />
        <div class="atv-rating-panel-count">
          {rating.count ? rating.count.toLocaleString("en-US") : ""}
        </div>
      </>
    ) : (
      <div class="atv-rating-empty">暂无评分</div>
    )}
  </div>
);

export { DoubanRating };
