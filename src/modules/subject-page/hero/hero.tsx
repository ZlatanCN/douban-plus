import type { HeroCallbacks, HeroData } from "../../../types";
import { RatingPanel } from "../ratings/rating-panel";
import { HeroActions } from "./hero-actions";
import { HeroBackground } from "./hero-background";
import { HeroMeta } from "./hero-meta";
import { HeroPoster } from "./hero-poster";
import { HeroSummary } from "./hero-summary";

type HeroProps = {
  callbacks: HeroCallbacks;
  data: HeroData;
};

const Hero = ({ callbacks, data }: HeroProps) => (
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
        <HeroPoster poster={data.poster} title={data.title} />
        <div class="atv-hero-info">
          <h1 class="atv-hero-title">
            {data.title.primary || data.title.full}
          </h1>
          {data.title.original ? (
            <div class="atv-hero-orig">{data.title.original}</div>
          ) : null}
          <HeroMeta info={data.info} isTV={data.isTV} year={data.year} />
          <RatingPanel
            douban={data.rating}
            imdbId={data.imdbId}
            isTV={data.isTV}
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
