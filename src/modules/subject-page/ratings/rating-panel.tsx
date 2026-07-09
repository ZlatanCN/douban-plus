import type { RatingInfo } from "@/types";

import { DoubanRating } from "./douban-rating";
import { ImdbRating } from "./imdb-rating";
import { MetacriticRating } from "./metacritic-rating";
import { RottenTomatoesRating } from "./rotten-tomatoes-rating";
import { useExternalRatings } from "./use-external-ratings";

type RatingPanelProps = {
  douban: RatingInfo | null;
  imdbId: string | null;
  isTV: boolean;
};

const RatingPanel = ({ douban, imdbId, isTV }: RatingPanelProps) => {
  const external = useExternalRatings(imdbId, isTV);

  if (!douban && !imdbId) {
    return null;
  }

  const resolved = Boolean(external);
  return (
    <div class="atv-rating-panel">
      <DoubanRating rating={douban} />
      {imdbId ? (
        <>
          <ImdbRating
            rating={external?.imdb?.rating ?? null}
            resolved={resolved}
          />
          <MetacriticRating rating={external?.mc ?? null} resolved={resolved} />
          <RottenTomatoesRating
            rating={external?.rt ?? null}
            resolved={resolved}
          />
        </>
      ) : null}
    </div>
  );
};

export { RatingPanel };
export type { RatingPanelProps };
