import type { ImdbRating } from "@/types";

type ParsedResponse = {
  titleText: string | null;
  aggregateRating: number | undefined;
  voteCount: number | undefined;
  /** When the queried tconst is an episode, the parent series id + title.
   *  Null for movies and series-level tconsts. */
  seriesInfo: {
    id: string;
    titleText: string;
  } | null;
};

type ParsedRaw = {
  data?: {
    title?: {
      id: string;
      titleText?: { text: string };
      ratingsSummary?: { aggregateRating: number; voteCount: number };
      series?: {
        series?: {
          id: string;
          titleText?: { text: string };
        };
      } | null;
    };
  };
  errors?: unknown;
};

const extractTitleFields = (parsed: ParsedRaw): ParsedResponse | null => {
  if (parsed.errors) {
    return null;
  }
  const title = parsed?.data?.title;
  const seriesNested = title?.series?.series;
  const seriesInfo = seriesNested?.id
    ? {
        id: seriesNested.id,
        titleText: seriesNested.titleText?.text ?? title?.titleText?.text ?? "",
      }
    : null;
  return {
    aggregateRating: title?.ratingsSummary?.aggregateRating,
    seriesInfo,
    titleText: title?.titleText?.text ?? null,
    voteCount: title?.ratingsSummary?.voteCount,
  };
};

const parseResponse = (json: string): ParsedResponse | { error: true } => {
  try {
    const parsed = JSON.parse(json) as ParsedRaw;
    const result = extractTitleFields(parsed);
    return result ?? { error: true as const };
  } catch {
    return { error: true as const };
  }
};

/** Parse the season-episodes response and compute a vote-weighted average rating. */
const parseSeasonRating = (
  json: string
): { rating: NonNullable<ImdbRating> } | null => {
  try {
    const parsed = JSON.parse(json) as {
      data?: {
        title?: {
          episodes?: {
            episodes?: {
              edges?: {
                node?: {
                  ratingsSummary?: {
                    aggregateRating: number | null;
                    voteCount: number | null;
                  };
                };
              }[];
            };
          };
        };
      };
    };

    const edges = parsed?.data?.title?.episodes?.episodes?.edges;
    if (!edges || edges.length === 0) {
      return null;
    }

    let totalWeighted = 0;
    let totalVotes = 0;
    for (const edge of edges) {
      const rs = edge?.node?.ratingsSummary;
      if (
        rs &&
        typeof rs.aggregateRating === "number" &&
        typeof rs.voteCount === "number" &&
        rs.voteCount > 0
      ) {
        totalWeighted += rs.aggregateRating * rs.voteCount;
        totalVotes += rs.voteCount;
      }
    }

    if (totalVotes === 0) {
      return null;
    }

    return {
      rating: {
        count: totalVotes,
        score: Math.round((totalWeighted / totalVotes) * 10) / 10,
      },
    };
  } catch {
    return null;
  }
};

export { extractTitleFields, parseResponse, parseSeasonRating };
export type { ParsedRaw, ParsedResponse };
