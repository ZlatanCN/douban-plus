import type { RatingInfo } from "@/modules/subject/domain";
import type { RatingResultMap } from "@/modules/subject/resolve/types";

import { DoubanRating } from "./douban-rating";
import { ExternalRating } from "./external-rating";

type RatingPanelProps = {
  douban: RatingInfo | null;
  externalRatings: RatingResultMap | null;
  imdbId: string | null;
};

const RatingPanel = ({ douban, externalRatings, imdbId }: RatingPanelProps) => {
  const rt = externalRatings?.rt;
  if (!douban && !imdbId && rt?.status === "resolved" && !rt.rating) {
    return null;
  }

  return (
    <div class="atv-rating-panel">
      <DoubanRating rating={douban} />
      {imdbId ? (
        <>
          <ExternalRating
            rating={externalRatings?.imdb.rating?.rating ?? null}
            resolved={externalRatings?.imdb.status === "resolved"}
            source="imdb"
          />
          <ExternalRating
            rating={externalRatings?.mc.rating ?? null}
            resolved={externalRatings?.mc.status === "resolved"}
            source="metacritic"
          />
        </>
      ) : null}
      <ExternalRating
        rating={rt?.rating ?? null}
        resolved={rt?.status === "resolved"}
        source="rt"
      />
    </div>
  );
};

export { RatingPanel };
