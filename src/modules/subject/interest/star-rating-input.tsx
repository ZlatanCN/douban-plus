import { IconStarEmpty, IconStarFull } from "@/shared/components/common/icons";

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
      <span>可选</span>
    </div>
    <div aria-label="评分（可选）" class="atv-interest-modal-stars">
      {Array.from({ length: 5 }, (_, index) => {
        const value = index + 1;
        const full = value <= rating;
        return (
          <button
            aria-label={`设为 ${value} 星评分`}
            class={`atv-interest-modal-star${full ? " is-full" : ""}`}
            disabled={disabled}
            key={index}
            onClick={() => onChange(value)}
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
