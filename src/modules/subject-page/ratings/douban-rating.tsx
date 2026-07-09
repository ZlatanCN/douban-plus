import { Stars } from "@/components/common/stars";
import type { RatingInfo } from "@/types";

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
          {rating.count
            ? `评价 ${rating.count.toLocaleString("en-US")}`
            : "已评分"}
        </div>
      </>
    ) : (
      <div class="atv-rating-empty">暂无评分</div>
    )}
  </div>
);

export { DoubanRating };
export type { DoubanRatingProps };
