import type { JSX } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

import { IconPopcorn, IconTomato } from "@/components/common/icons";
import { Stars } from "@/components/common/stars";
import type { ImdbRating, McRating, RtRating } from "@/types";
import { animateWithReducedMotion, springConfigs } from "@/utils/springs";

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
    }
  | {
      rating: McRating | null;
      resolved: boolean;
      source: "metacritic";
    }
  | {
      rating: RtRating | null;
      resolved: boolean;
      source: "rt";
    };

const SOURCE_CLASS = {
  imdb: "atv-rating-panel-imdb",
  metacritic: "atv-rating-panel-mc",
  rt: "atv-rating-panel-rt",
} as const satisfies Record<ExternalRatingProps["source"], string>;

const CONTENT_TRANSITION_MS = 300;

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

const renderRottenTomatoesRating = (rating: RtRating): JSX.Element => (
  <>
    <div class="atv-rt-score-row">
      <div
        class={`atv-rt-score-value ${
          isFresh(rating.criticsScore) ? "is-fresh" : "is-rotten"
        }`}
      >
        {`${rating.criticsScore}%`}
      </div>
      <div class="atv-rt-divider" />
      <div
        class={`atv-rt-score-value ${
          isFresh(rating.audienceScore) ? "is-fresh" : "is-rotten"
        }`}
      >
        {`${rating.audienceScore}%`}
      </div>
    </div>
    <div class="atv-rt-label-row">
      <RtLabel
        className="is-critics"
        icon={<IconTomato />}
        score={rating.criticsScore}
        text="影评人"
      />
      <RtLabel
        className="is-audience"
        icon={<IconPopcorn />}
        score={rating.audienceScore}
        text="观众"
      />
    </div>
    <div class="atv-rt-count-row">
      <span class="atv-rt-count-value">
        {`评价 ${rating.criticsCount.toLocaleString("en-US")}`}
      </span>
      <span class="atv-rt-count-value">
        {`评价 ${rating.audienceCount.toLocaleString("en-US")}`}
      </span>
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
  const shouldRender = !props.resolved || Boolean(props.rating);
  const [rendered, setRendered] = useState(shouldRender);
  const [exiting, setExiting] = useState(!shouldRender);
  const panelRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<{ stop: () => void } | null>(null);
  const prevHasRatingRef = useRef(false);

  useEffect(() => {
    if (shouldRender) {
      setRendered(true);
      setExiting(false);
      return;
    }

    setExiting(true);
    const timer = window.setTimeout(
      () => setRendered(false),
      CONTENT_TRANSITION_MS
    );
    return () => window.clearTimeout(timer);
  }, [shouldRender]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }
    const hasRating = Boolean(props.rating);
    const justLoaded = hasRating && !prevHasRatingRef.current;
    prevHasRatingRef.current = hasRating;

    if (justLoaded) {
      animationRef.current?.stop();
      animationRef.current = animateWithReducedMotion(panel, {
        properties: {
          opacity: [0, 1],
          transform: ["translateY(4px)", "translateY(0)"],
        },
        reducedMotionProperties: { opacity: [0, 1] },
        springConfig: springConfigs.ratingEntrance,
      });
    }
  }, [props.rating, props.resolved, props.source]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !exiting) {
      return;
    }

    animationRef.current?.stop();
    animationRef.current = animateWithReducedMotion(panel, {
      properties: {
        opacity: [1, 0],
        transform: ["translateY(0)", "translateY(-4px)"],
      },
      reducedMotionProperties: { opacity: [1, 0] },
      springConfig: springConfigs.ratingEntrance,
    });
  }, [exiting]);

  if (!rendered) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      class={`${SOURCE_CLASS[props.source]} ${ratingStateClass(
        Boolean(props.rating),
        props.resolved
      )}${exiting ? " is-exiting" : ""}`}
    >
      <RatingLogo name={props.source} />
      {renderExternalRatingContent(props)}
    </div>
  );
};

export { ExternalRating };
export type { ExternalRatingProps };
