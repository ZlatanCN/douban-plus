import type { HeroCallbacks, HeroData } from "@/types";

import { RatingPanel } from "../ratings/rating-panel";
import { FirstBroadcastPlatform } from "./first-broadcast-platform";
import { HeroActions } from "./hero-actions";
import { HeroBackground } from "./hero-background";
import { HeroMeta } from "./hero-meta";
import { HeroPoster } from "./hero-poster";
import { HeroSummary } from "./hero-summary";
import { useFirstBroadcastPlatform } from "./use-first-broadcast-platform";

type HeroProps = {
  callbacks: HeroCallbacks;
  data: HeroData;
  expandNativeSummary?: () => Promise<string | null>;
  onOpenPoster?: (src: string, alt: string) => void;
};

const noop = (): undefined => undefined;

const Hero = ({
  callbacks,
  data,
  expandNativeSummary,
  onOpenPoster = noop,
}: HeroProps) => {
  const firstBroadcastPlatform = useFirstBroadcastPlatform(
    data.subjectId,
    data.interest.loggedIn
  );

  return (
    <section class="atv-hero">
      <HeroBackground
        photos={data.photos}
        poster={data.poster}
        subjectId={data.subjectId}
      />
      <div class="atv-hero-vignette" />
      <div class="atv-hero-overlay-x" />
      <div class="atv-hero-overlay-y" />
      <div class="atv-hero-inner-section">
        <div class="atv-hero-inner">
          <HeroPoster
            onOpenPoster={onOpenPoster}
            poster={data.poster}
            title={data.title}
          />
          <div class="atv-hero-info">
            <h1 class="atv-hero-title">
              {data.title.primary || data.title.full}
            </h1>
            {data.title.original ? (
              <div class="atv-hero-orig">{data.title.original}</div>
            ) : null}
            <HeroMeta
              info={data.info}
              isTV={data.isTV}
              leading={
                firstBroadcastPlatform ? (
                  <FirstBroadcastPlatform platform={firstBroadcastPlatform} />
                ) : null
              }
              year={data.year}
            />
            <RatingPanel
              douban={data.rating}
              imdbId={data.imdbId}
              isTV={data.isTV}
            />
            <HeroActions callbacks={callbacks} state={data.interest} />
            {data.summary ? (
              <HeroSummary
                expandNativeSummary={expandNativeSummary}
                text={data.summary}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};

export { Hero };
export type { HeroProps };
