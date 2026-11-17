import type { McRating, McScoreSide } from "@/modules/subject/domain";

const countLabel = (count: number | null): string | null =>
  count === null ? null : `评价 ${count.toLocaleString("en-US")}`;

const ScoreSide = ({
  className,
  label,
  score,
  scale,
}: {
  className: string;
  label: string;
  score: McScoreSide;
  scale: "/100" | "/10";
}) => (
  <div class={`atv-mc-score-side ${className}`}>
    <div class="atv-mc-score-label">{label}</div>
    <div class="atv-mc-score-reading">
      <span class="atv-rating-panel-score atv-mc-score-value">
        {score.displayScore}
      </span>
      <span class="atv-mc-score-scale">{scale}</span>
    </div>
    {countLabel(score.reviewCount) ? (
      <div class="atv-mc-rating-count">{countLabel(score.reviewCount)}</div>
    ) : null}
  </div>
);

const MetacriticScore = ({ rating }: { rating: McRating }) => (
  <div
    class={`atv-mc-score-grid ${
      rating.critics && rating.audience ? "" : "is-single"
    }`}
  >
    {rating.critics ? (
      <ScoreSide
        className="atv-mc-critics"
        label="影评人"
        scale="/100"
        score={rating.critics}
      />
    ) : null}
    {rating.audience ? (
      <ScoreSide
        className="atv-mc-audience"
        label="观众"
        scale="/10"
        score={rating.audience}
      />
    ) : null}
  </div>
);

export { MetacriticScore };
