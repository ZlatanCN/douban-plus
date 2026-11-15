import type { JSX } from "preact";

import type {
  ImdbRating,
  McRating,
  RtCount,
  RtRating,
} from "@/modules/subject/domain";
import { IconPopcorn, IconTomato } from "@/shared/components/common/icons";
import { Stars } from "@/shared/components/common/stars";
import { useEntranceExitAnimation } from "@/shared/hooks/use-entrance-exit-animation";
import { springConfigs } from "@/shared/utils/springs";

import {
  isFresh,
  mcWordRatingChinese,
  ratingStateClass,
  scoreClass,
} from "./rating-helpers";
import { RatingLogo } from "./rating-logo";

type ExternalRatingProps =
  | {
      rating: ImdbRating | null;
      resolved: boolean;
      source: "imdb";
      sourceUrl?: string | null;
    }
  | {
      rating: McRating | null;
      resolved: boolean;
      source: "metacritic";
      sourceUrl?: string | null;
    }
  | {
      rating: RtRating | null;
      resolved: boolean;
      source: "rt";
      sourceUrl?: string | null;
    };

const SOURCE_CLASS = {
  imdb: "atv-rating-panel-imdb",
  metacritic: "atv-rating-panel-mc",
  rt: "atv-rating-panel-rt",
} as const satisfies Record<ExternalRatingProps["source"], string>;

const SOURCE_LINK_LABEL = {
  imdb: "在 IMDb 打开评分",
  metacritic: "在 Metacritic 打开评分",
  rt: "在烂番茄打开评分",
} as const satisfies Record<ExternalRatingProps["source"], string>;

const renderImdbRating = (rating: ImdbRating): JSX.Element => (
  <>
    <div class="atv-rating-panel-score">{rating.score.toFixed(1)}</div>
    <Stars score={rating.score} />
    <div class="atv-rating-panel-count">
      {rating.count ? `评价 ${rating.count.toLocaleString("en-US")}` : "已评分"}
    </div>
  </>
);

const renderMetacriticRating = (rating: McRating): JSX.Element => (
  <>
    <div class={`atv-rating-panel-score ${scoreClass(rating.score)}`}>
      {String(rating.score)}
    </div>
    <div class="atv-mc-label-row">
      <span class="atv-mc-bar-track">
        <span
          class={`atv-mc-bar-fill ${scoreClass(rating.score)}`}
          style={{ width: `${Math.min(100, rating.score)}%` }}
        />
      </span>
      <span class="atv-mc-word-label">{mcWordRatingChinese(rating.score)}</span>
    </div>
    <div class="atv-rating-panel-count">
      {rating.reviewCount
        ? `评价 ${rating.reviewCount.toLocaleString("en-US")}`
        : "已评分"}
    </div>
  </>
);

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

const formatRtCount = (count: RtCount | null): string => {
  if (!count) {
    return "";
  }
  if (count.kind === "range") {
    return `${count.lowerBound.toLocaleString("en-US")}+`;
  }
  return count.value.toLocaleString("en-US");
};

const renderRottenTomatoesRating = (rating: RtRating): JSX.Element => (
  <>
    <div
      class={`atv-rt-score-row ${
        rating.criticsScore === null || rating.audienceScore === null
          ? "is-single"
          : ""
      }`}
    >
      {rating.criticsScore !== null && (
        <div
          class={`atv-rt-score-value ${
            isFresh(rating.criticsScore) ? "is-fresh" : "is-rotten"
          }`}
        >
          {`${rating.criticsScore}%`}
        </div>
      )}
      {rating.criticsScore !== null && rating.audienceScore !== null ? (
        <div class="atv-rt-divider" />
      ) : null}
      {rating.audienceScore !== null && (
        <div
          class={`atv-rt-score-value ${
            isFresh(rating.audienceScore) ? "is-fresh" : "is-rotten"
          }`}
        >
          {`${rating.audienceScore}%`}
        </div>
      )}
    </div>
    <div class="atv-rt-label-row">
      {rating.criticsScore !== null && (
        <RtLabel
          className="is-critics"
          icon={<IconTomato />}
          score={rating.criticsScore}
          text="影评人"
        />
      )}
      {rating.audienceScore !== null && (
        <RtLabel
          className="is-audience"
          icon={<IconPopcorn />}
          score={rating.audienceScore}
          text="观众"
        />
      )}
    </div>
    <div class="atv-rt-count-row">
      {rating.criticsScore !== null && rating.criticsCount !== null ? (
        <span class="atv-rt-count-value">
          {`评价 ${formatRtCount(rating.criticsCount)}`}
        </span>
      ) : null}
      {rating.audienceScore !== null && rating.audienceCount !== null ? (
        <span class="atv-rt-count-value">
          {`评价 ${formatRtCount(rating.audienceCount)}`}
        </span>
      ) : null}
    </div>
  </>
);

const renderLoadedRating = (props: ExternalRatingProps): JSX.Element | null => {
  switch (props.source) {
    case "imdb": {
      return props.rating ? renderImdbRating(props.rating) : null;
    }
    case "metacritic": {
      return props.rating ? renderMetacriticRating(props.rating) : null;
    }
    case "rt": {
      return props.rating ? renderRottenTomatoesRating(props.rating) : null;
    }
    default: {
      return null;
    }
  }
};

const renderExternalRatingContent = (
  props: ExternalRatingProps
): JSX.Element | null => {
  if (props.rating) {
    return renderLoadedRating(props);
  }
  if (props.resolved) {
    return null;
  }
  return <div class="atv-rating-panel-skeleton" />;
};

const ExternalRating = (props: ExternalRatingProps) => {
  const sourceUrl =
    props.sourceUrl ?? (props.source === "rt" ? props.rating?.sourceUrl : null);
  const shouldRender = !props.resolved || Boolean(props.rating);
  const { rendered, setRef } = useEntranceExitAnimation(
    shouldRender,
    Boolean(props.rating),
    springConfigs.ratingEntrance
  );

  if (!rendered) {
    return null;
  }

  const logo = <RatingLogo name={props.source} />;
  const sourceLogo = sourceUrl ? (
    <a
      aria-label={SOURCE_LINK_LABEL[props.source]}
      class={`atv-rating-source atv-${props.source}-source${
        props.source === "rt" ? " atv-rt-source" : ""
      }`}
      href={sourceUrl}
      rel="noopener noreferrer"
      target="_blank"
    >
      {logo}
    </a>
  ) : (
    logo
  );

  return (
    <div
      ref={setRef}
      class={`${SOURCE_CLASS[props.source]} ${ratingStateClass(
        Boolean(props.rating),
        props.resolved
      )}`}
    >
      {props.source === "rt" ? (
        <span class="atv-rt-logo-group">
          {sourceLogo}
          {props.rating?.stale ? (
            <span class="atv-rt-stale">旧评分</span>
          ) : null}
        </span>
      ) : (
        sourceLogo
      )}
      {renderExternalRatingContent(props)}
    </div>
  );
};

export { ExternalRating };
