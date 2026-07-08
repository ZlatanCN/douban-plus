import { IconStarEmpty, IconStarFull } from "../../../components/common/icons";

interface StarRatingInputProps {
  disabled?: boolean;
  onChange: (rating: number) => void;
  rating: number;
}

const StarRatingInput = ({
  disabled = false,
  onChange,
  rating,
}: StarRatingInputProps) => (
  <div class="atv-interest-modal-stars">
    {Array.from({ length: 5 }, (_, index) => {
      const value = index + 1;
      const full = value <= rating;
      return (
        <button
          class={`atv-interest-modal-star${full ? " is-full" : ""}`}
          disabled={disabled}
          key={index}
          onClick={() => {
            if (!disabled) {
              onChange(value);
            }
          }}
          type="button"
        >
          {full ? <IconStarFull /> : <IconStarEmpty />}
        </button>
      );
    })}
  </div>
);

export { StarRatingInput };
export type { StarRatingInputProps };
