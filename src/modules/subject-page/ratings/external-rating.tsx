import type { JSX } from "preact";
import { useCallback, useLayoutEffect, useRef, useState } from "preact/hooks";

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
  const panelRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<ReturnType<
    typeof animateWithReducedMotion
  > | null>(null);
  const animationGenerationRef = useRef(0);
  const desiredRenderRef = useRef(shouldRender);
  const pendingEntranceRef = useRef(false);
  const prevHasRatingRef = useRef(false);

  const stopAnimation = useCallback(() => {
    animationGenerationRef.current += 1;
    animationRef.current?.stop();
    animationRef.current = null;
  }, []);

  const animatePanel = useCallback(
    (
      panelElement: HTMLDivElement,
      properties: Parameters<typeof animateWithReducedMotion>[1]["properties"],
      reducedMotionProperties: NonNullable<
        Parameters<
          typeof animateWithReducedMotion
        >[1]["reducedMotionProperties"]
      >
    ) => {
      stopAnimation();
      const animationGeneration = animationGenerationRef.current;
      const animation = animateWithReducedMotion(panelElement, {
        properties,
        reducedMotionProperties,
        springConfig: springConfigs.ratingEntrance,
      });
      animationRef.current = animation;
      return { animation, animationGeneration };
    },
    [stopAnimation]
  );

  const animateEntrance = useCallback(
    (panel: HTMLDivElement) => {
      animatePanel(
        panel,
        {
          opacity: [0, 1],
          transform: ["translateY(4px)", "translateY(0)"],
        },
        { opacity: [0, 1] }
      );
    },
    [animatePanel]
  );

  const setPanelRef = useCallback(
    (element: HTMLDivElement | null) => {
      panelRef.current = element;
      if (element && pendingEntranceRef.current) {
        pendingEntranceRef.current = false;
        animateEntrance(element);
      }
    },
    [animateEntrance]
  );

  useLayoutEffect(() => {
    const wasDesired = desiredRenderRef.current;
    desiredRenderRef.current = shouldRender;
    const hasRating = Boolean(props.rating);
    const justLoaded = hasRating && !prevHasRatingRef.current;
    prevHasRatingRef.current = hasRating;

    if (shouldRender) {
      if (!wasDesired) {
        stopAnimation();
      }
      if (justLoaded) {
        const panel = panelRef.current;
        if (panel) {
          animateEntrance(panel);
        } else {
          pendingEntranceRef.current = true;
        }
      }
      setRendered(true);
      return;
    }

    pendingEntranceRef.current = false;
    const panel = panelRef.current;
    if (!panel) {
      setRendered(false);
      return;
    }

    const { animation, animationGeneration } = animatePanel(
      panel,
      {
        opacity: [1, 0],
        transform: ["translateY(0)", "translateY(-4px)"],
      },
      { opacity: [1, 0] }
    );

    void (async () => {
      try {
        await animation.finished;
        if (
          animationGenerationRef.current === animationGeneration &&
          !desiredRenderRef.current
        ) {
          animationRef.current = null;
          setRendered(false);
        }
      } catch {
        // A new rating state superseded this exit animation.
      }
    })();
  }, [
    animateEntrance,
    animatePanel,
    props.rating,
    shouldRender,
    stopAnimation,
  ]);

  useLayoutEffect(() => stopAnimation, [stopAnimation]);

  if (!rendered) {
    return null;
  }

  return (
    <div
      ref={setPanelRef}
      class={`${SOURCE_CLASS[props.source]} ${ratingStateClass(
        Boolean(props.rating),
        props.resolved
      )}`}
    >
      <RatingLogo name={props.source} />
      {renderExternalRatingContent(props)}
    </div>
  );
};

export { ExternalRating };
export type { ExternalRatingProps };
