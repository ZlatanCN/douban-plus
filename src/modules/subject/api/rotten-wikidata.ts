import type { ResolutionContext } from "@/modules/subject/resolve/types";

import type { IdentityLookup, RottenMapping } from "./rotten-wikidata-claims";
import { fetchEntities } from "./rotten-wikidata-lookup";
import { combineLookups } from "./rotten-wikidata-match";

const fromSettledLookup = (
  result: PromiseSettledResult<IdentityLookup | null>
): IdentityLookup | null =>
  result.status === "fulfilled"
    ? result.value
    : { mappings: [], state: "error" };

const resolveRottenMapping = async (
  context: ResolutionContext,
  signal: AbortSignal
): Promise<RottenMapping> => {
  if (!context.subjectId) {
    return { reason: "missing", status: "unavailable" };
  }
  if (context.seasonConflict || context.unsupportedEpisode) {
    return { reason: "season", status: "unavailable" };
  }
  const lookups = await Promise.allSettled([
    context.imdbId
      ? fetchEntities(
          "P345",
          context.imdbId,
          signal,
          context.kind === "season" ? (context.season ?? undefined) : undefined
        )
      : null,
    fetchEntities("P4529", context.subjectId, signal),
  ]);
  const [imdbResult, doubanResult] = lookups;
  const imdb = fromSettledLookup(imdbResult);
  const douban = fromSettledLookup(doubanResult) ?? {
    mappings: [],
    state: "error",
  };
  return combineLookups(imdb, douban, context);
};

export { resolveRottenMapping };
