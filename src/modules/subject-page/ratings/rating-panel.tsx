import type { RatingInfo } from "@/types";

import { DoubanRating } from "./douban-rating";
import { ExternalRating } from "./external-rating";
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
          <ExternalRating
            rating={external?.imdb?.rating ?? null}
            resolved={resolved}
            source="imdb"
          />
          <ExternalRating
            rating={external?.mc ?? null}
            resolved={resolved}
            source="metacritic"
          />
          <ExternalRating
            rating={external?.rt ?? null}
            resolved={resolved}
            source="rt"
          />
        </>
      ) : null}
    </div>
  );
};

export { RatingPanel };
export type { RatingPanelProps };
