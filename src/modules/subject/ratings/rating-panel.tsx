import type { RatingInfo } from "@/modules/subject/domain";
import type { RatingResultMap } from "@/modules/subject/resolve/types";

import { DoubanRating } from "./douban-rating";
import { ExternalRating } from "./external-rating";

type RatingPanelProps = {
  douban: RatingInfo | null;
  externalRatings: RatingResultMap | null;
  imdbId: string | null;
};

const sourceUrlOf = (
  rating: { sourceUrl?: string | null } | null | undefined
): string | null => rating?.sourceUrl ?? null;

const renderIdentifiedRatings = (
  externalRatings: RatingResultMap | null,
  imdbId: string | null
) => {
  const imdb = externalRatings?.imdb;
  const metacritic = externalRatings?.mc;
  return (
    <>
      {imdbId ? (
        <ExternalRating
          rating={imdb?.rating?.rating ?? null}
          resolved={imdb?.status === "resolved"}
          sourceUrl={sourceUrlOf(imdb?.rating)}
          source="imdb"
        />
      ) : null}
      <ExternalRating
        rating={metacritic?.rating ?? null}
        resolved={metacritic?.status === "resolved"}
        sourceUrl={sourceUrlOf(metacritic?.rating)}
        source="metacritic"
      />
    </>
  );
};

const RatingPanel = ({ douban, externalRatings, imdbId }: RatingPanelProps) => {
  const rt = externalRatings?.rt;
  const metacritic = externalRatings?.mc;
  if (
    !douban &&
    !imdbId &&
    rt?.status === "resolved" &&
    !rt.rating &&
    metacritic?.status === "resolved" &&
    !metacritic.rating
  ) {
    return null;
  }

  return (
    <div class="atv-rating-panel">
      <DoubanRating rating={douban} />
      {renderIdentifiedRatings(externalRatings, imdbId)}
      <ExternalRating
        rating={rt?.rating ?? null}
        resolved={rt?.status === "resolved"}
        sourceUrl={sourceUrlOf(rt?.rating)}
        source="rt"
      />
    </div>
  );
};

export { RatingPanel };
