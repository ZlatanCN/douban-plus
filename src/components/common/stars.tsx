import { IconStarEmpty, IconStarFull, IconStarHalf } from "./icons";

type StarsProps = {
  className?: string;
  outOfFive?: boolean;
  score: number;
};

const starComponents = (
  score: number,
  outOfFive = false
): (typeof IconStarFull)[] => {
  const normalized = outOfFive ? score : score / 2;

  return Array.from({ length: 5 }, (_, index) => {
    const position = index + 1;
    if (normalized >= position - 0.25) {
      return IconStarFull;
    }
    if (normalized >= position - 0.5) {
      return IconStarHalf;
    }
    return IconStarEmpty;
  });
};

const Stars = ({
  className = "atv-rating-stars",
  outOfFive = false,
  score,
}: StarsProps) => (
  <span class={className}>
    {starComponents(score, outOfFive).map((Icon, index) => (
      <Icon key={index} />
    ))}
  </span>
);

export { Stars };
export type { StarsProps };
