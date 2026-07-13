import type { RatingResultMap } from "@/resolve/types";
import type { RatingInfo } from "@/types";

import { DoubanRating } from "./douban-rating";
import { ExternalRating } from "./external-rating";

type RatingPanelProps = {
  douban: RatingInfo | null;
  externalRatings: RatingResultMap | null;
  imdbId: string | null;
};

const RatingPanel = ({ douban, externalRatings, imdbId }: RatingPanelProps) => {
  if (!douban && !imdbId) {
    return null;
  }

  const resolved = Boolean(externalRatings);
  return (
    <div class="atv-rating-panel">
      <DoubanRating rating={douban} />
      {imdbId ? (
        <>
          <ExternalRating
            rating={externalRatings?.imdb?.rating ?? null}
            resolved={resolved}
            source="imdb"
          />
          <ExternalRating
            rating={externalRatings?.mc ?? null}
            resolved={resolved}
            source="metacritic"
          />
          <ExternalRating
            rating={externalRatings?.rt ?? null}
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
