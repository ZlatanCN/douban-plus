import { IconThumb } from "./icons";

type VoteButtonProps = {
  ariaLabel: string;
  className: string;
  count: number;
  disabled?: boolean;
  onVote: () => void;
  voted: boolean;
};

const VoteButton = ({
  ariaLabel,
  className,
  count,
  disabled = false,
  onVote,
  voted,
}: VoteButtonProps) => (
  <button
    aria-label={ariaLabel}
    aria-pressed={voted}
    class={`${className}${voted ? " is-voted" : ""}`}
    disabled={disabled}
    onClick={(event) => {
      event.stopPropagation();
      onVote();
    }}
    type="button"
  >
    <IconThumb />
    <span class="atv-vote-count">{count}</span>
  </button>
);

export { VoteButton };
export type { VoteButtonProps };
