import type { HeroCallbacks, HeroData } from "@/modules/subject/domain";
import type { RatingResultMap } from "@/modules/subject/resolve/types";
import { IconArrow } from "@/shared/components/common/icons";

import { RatingPanel } from "../ratings/rating-panel";
import { FirstBroadcastPlatform } from "./first-broadcast-platform";
import { HeroActions } from "./hero-actions";
import { HeroBackground } from "./hero-background";
import { HeroMeta } from "./hero-meta";
import { HeroPoster } from "./hero-poster";
import { HeroSummary } from "./hero-summary";

type HeroProps = {
  callbacks: HeroCallbacks;
  data: HeroData;
  externalRatings?: RatingResultMap | null;
  firstBroadcastPlatform?: string | null;
  onOpenPoster?: (src: string, alt: string) => void;
};

const noop = (): undefined => undefined;

const Hero = ({
  callbacks,
  data,
  externalRatings = null,
  firstBroadcastPlatform = null,
  onOpenPoster = noop,
}: HeroProps) => (
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
          {data.rankLabel ? (
            <a
              aria-label={`查看榜单：${data.rankLabel.title}，${data.rankLabel.position}`}
              class="atv-rank-label"
              href={data.rankLabel.href}
              rel="noopener"
              target="_blank"
            >
              <span class="atv-rank-label-entry">
                <strong>{data.rankLabel.position}</strong>
                <span class="atv-rank-label-title">{data.rankLabel.title}</span>
                <IconArrow class="atv-rank-label-arrow" />
              </span>
            </a>
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
            externalRatings={externalRatings}
            imdbId={data.imdbId}
          />
          <HeroActions callbacks={callbacks} state={data.interest} />
          {data.summary ? <HeroSummary text={data.summary} /> : null}
        </div>
      </div>
    </div>
  </section>
);

export { Hero };
export type { HeroProps };
