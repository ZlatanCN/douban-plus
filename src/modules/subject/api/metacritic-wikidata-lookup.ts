import { hasIdentity } from "./metacritic-wikidata-claims";
import type { Entity } from "./metacritic-wikidata-claims";
import { fetchEntities, searchEntityIds } from "./wikidata-client";

type LookupResult =
  | { entity: Entity; status: "matched" }
  | { status: "ambiguous" | "missing" };

const findEntity = async (
  property: "P345" | "P4529",
  value: string,
  signal: AbortSignal
): Promise<LookupResult> => {
  const search = await searchEntityIds(property, value, signal);
  if (search.status !== "matched") {
    return search;
  }
  const entities = await fetchEntities<Entity>(search.entityIds, signal);
  const matches = Object.values(entities).filter((entity) =>
    hasIdentity(entity, property, value)
  );
  if (matches.length > 1) {
    return { status: "ambiguous" };
  }
  const [entity] = matches;
  return entity ? { entity, status: "matched" } : { status: "missing" };
};

export { findEntity };
export type { LookupResult };
