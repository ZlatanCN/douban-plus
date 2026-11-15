import { hasIdentity } from "./metacritic-wikidata-claims";
import type { Entity } from "./metacritic-wikidata-claims";
import { findEntityCandidates } from "./wikidata-client";

type LookupResult =
  | { entity: Entity; status: "matched" }
  | { status: "ambiguous" | "missing" };

const findEntity = async (
  property: "P345" | "P4529",
  value: string,
  signal: AbortSignal
): Promise<LookupResult> => {
  const candidates = await findEntityCandidates<Entity>(
    property,
    value,
    signal
  );
  if (candidates.status !== "matched") {
    return candidates;
  }
  const matches = candidates.entities.filter((entity) =>
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
