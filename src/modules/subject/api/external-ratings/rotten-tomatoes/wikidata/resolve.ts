import { entityReference } from "@/modules/subject/api/external-ratings/shared/wikidata-client";
import type { ResolutionContext } from "@/modules/subject/resolve/types";

import { claimValues } from "./claims";
import type { EntityMapping, IdentityLookup, RottenMapping } from "./claims";
import { fetchEntities } from "./lookup";
import { combineLookups } from "./match";

const peopleFor = (
  mappings: EntityMapping[],
  kind: "movie" | "series" | "season",
  rtId: string
): EntityMapping[] =>
  mappings.filter((mapping) => mapping.kind === kind && mapping.rtId === rtId);

const identityFor = (
  mappings: EntityMapping[],
  context: ResolutionContext,
  mapping: Extract<RottenMapping, { status: "matched" }>
): { identityImdbIds: string[]; identityPersonIds: string[] } => {
  const property = context.kind === "movie" ? "P57" : "P170";
  let workMappings: EntityMapping[];
  if (context.kind === "movie") {
    workMappings = peopleFor(mappings, "movie", mapping.rtId);
  } else if (context.kind === "series") {
    workMappings = peopleFor(mappings, "series", mapping.rtId);
  } else {
    workMappings = peopleFor(
      mappings,
      "series",
      mapping.seriesRtId ?? mapping.rtId
    );
  }
  const identityPersonIds = [
    ...new Set(
      workMappings.flatMap((work) =>
        claimValues(work.entity.claims?.[property])
          .map(entityReference)
          .filter((id): id is string => id !== null && /^Q\d+$/u.test(id))
      )
    ),
  ].toSorted();
  const identityImdbIds = [
    ...new Set(
      workMappings
        .flatMap((work) => claimValues(work.entity.claims?.P345))
        .map(String)
        .filter((id) => /^tt\d{7,}$/u.test(id))
    ),
  ].toSorted();
  return { identityImdbIds, identityPersonIds };
};

const fromSettledLookup = (
  result: PromiseSettledResult<IdentityLookup | null>
): IdentityLookup | null =>
  result.status === "fulfilled"
    ? result.value
    : {
        failure:
          result.reason instanceof SyntaxError
            ? "parse-error"
            : "request-error",
        mappings: [],
        state: "error",
      };

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
    failure: "request-error",
    mappings: [],
    state: "error",
  };
  const result = combineLookups(imdb, douban, context);
  if (result.status === "unavailable") {
    return result;
  }
  const mappings = [...(imdb?.mappings ?? []), ...(douban?.mappings ?? [])];
  const identity = identityFor(mappings, context, result);
  return {
    ...result,
    ...identity,
  };
};

export { resolveRottenMapping };
