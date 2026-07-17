import { IconStarEmpty, IconStarFull } from "@/components/common/icons";

type StarRatingInputProps = {
  disabled?: boolean;
  onChange: (rating: number) => void;
  rating: number;
};

const StarRatingInput = ({
  disabled = false,
  onChange,
  rating,
}: StarRatingInputProps) => (
  <fieldset class="atv-interest-modal-rating">
    <legend class="atv-screen-reader-only">我的评分（可选）</legend>
    <div class="atv-interest-modal-rating-header">
      <span>我的评分</span>
      <div>
        <span>可选</span>
        {rating > 0 ? (
          <button
            aria-label="清除评分"
            class="atv-interest-modal-rating-clear"
            disabled={disabled}
            onClick={() => onChange(0)}
            type="button"
          >
            清除
          </button>
        ) : null}
      </div>
    </div>
    <div aria-label="评分（可选）" class="atv-interest-modal-stars">
      {Array.from({ length: 5 }, (_, index) => {
        const value = index + 1;
        const full = value <= rating;
        return (
          <button
            aria-label={
              rating === value ? `取消 ${value} 星评分` : `评分 ${value} 星`
            }
            class={`atv-interest-modal-star${full ? " is-full" : ""}`}
            disabled={disabled}
            key={index}
            onClick={() => {
              if (!disabled) {
                onChange(rating === value ? 0 : value);
              }
            }}
            type="button"
          >
            <span aria-hidden="true">
              {full ? <IconStarFull /> : <IconStarEmpty />}
            </span>
          </button>
        );
      })}
    </div>
  </fieldset>
);

export { StarRatingInput };
export type { StarRatingInputProps };
