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

import { MetacriticScore } from "./metacritic-score";
import { isFresh, ratingStateClass } from "./rating-helpers";
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

const formatRtCount = (count: RtCount | null): string => {
  if (!count) {
    return "";
  }
  if (count.kind === "range") {
    return `${count.lowerBound.toLocaleString("en-US")}+`;
  }
  return count.value.toLocaleString("en-US");
};

const RtSide = ({
  count,
  icon,
  kind,
  score,
}: {
  count: RtCount | null;
  icon: JSX.Element;
  kind: "critics" | "audience";
  score: number;
}) => {
  const freshness = isFresh(score) ? "is-fresh" : "is-rotten";
  const countText = count === null ? "" : `评价 ${formatRtCount(count)}`;

  return (
    <div class={`atv-rating-dual-side atv-rt-score-side atv-rt-${kind}`}>
      <div class="atv-rating-dual-reading atv-rt-score-reading">
        <span class={`atv-rt-score-value ${freshness}`}>
          {score}
          <span class="atv-rt-score-scale">%</span>
        </span>
      </div>
      <span
        class={`atv-rating-dual-label atv-rt-label-item is-${kind} ${freshness}`}
      >
        <span class="atv-rt-score-icon">{icon}</span>
        <span class="atv-rt-score-label">
          {kind === "critics" ? "影评人" : "观众"}
        </span>
      </span>
      <div
        aria-hidden={count === null}
        class={`atv-rating-dual-count atv-rt-count-value${
          count === null ? " is-empty" : ""
        }`}
      >
        {countText}
      </div>
    </div>
  );
};

const renderRottenTomatoesRating = (rating: RtRating): JSX.Element => (
  <div
    class={`atv-rating-dual-grid atv-rt-score-grid ${
      rating.criticsScore === null || rating.audienceScore === null
        ? "is-single"
        : ""
    }`}
  >
    {rating.criticsScore !== null && (
      <RtSide
        count={rating.criticsCount}
        icon={<IconTomato />}
        kind="critics"
        score={rating.criticsScore}
      />
    )}
    {rating.audienceScore !== null && (
      <RtSide
        count={rating.audienceCount}
        icon={<IconPopcorn />}
        kind="audience"
        score={rating.audienceScore}
      />
    )}
  </div>
);

const renderLoadedRating = (props: ExternalRatingProps): JSX.Element | null => {
  switch (props.source) {
    case "imdb": {
      return props.rating ? renderImdbRating(props.rating) : null;
    }
    case "metacritic": {
      return props.rating ? <MetacriticScore rating={props.rating} /> : null;
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
  const staleLabel =
    props.source === "metacritic" && props.rating?.stale ? (
      <span class="atv-mc-stale">旧评分</span>
    ) : null;
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
  let logoGroup: JSX.Element = sourceLogo;
  if (props.source === "rt") {
    logoGroup = (
      <span class="atv-rt-logo-group">
        {sourceLogo}
        {props.rating?.stale ? <span class="atv-rt-stale">旧评分</span> : null}
      </span>
    );
  } else if (props.source === "metacritic") {
    logoGroup = (
      <span class="atv-mc-logo-group">
        {sourceLogo}
        {staleLabel}
      </span>
    );
  }

  return (
    <div
      ref={setRef}
      class={`${SOURCE_CLASS[props.source]} ${ratingStateClass(
        Boolean(props.rating),
        props.resolved
      )}`}
    >
      {logoGroup}
      {renderExternalRatingContent(props)}
    </div>
  );
};

export { ExternalRating };
