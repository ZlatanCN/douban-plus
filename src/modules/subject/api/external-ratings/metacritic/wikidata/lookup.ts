import { findEntityCandidates } from "@/modules/subject/api/external-ratings/shared/wikidata-client";

import { hasIdentity } from "./claims";
import type { Entity } from "./claims";

type LookupResult =
  | { candidateTargets: string[]; entity: Entity; status: "matched" }
  | { candidateTargets: string[]; status: "ambiguous" | "missing" };

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
    return { ...candidates, candidateTargets: [] };
  }
  const candidateTargets = candidates.entities
    .map((entity) => entity.id)
    .filter((id) => /^Q\d+$/u.test(id));
  const matches = candidates.entities.filter((entity) =>
    hasIdentity(entity, property, value)
  );
  if (matches.length > 1) {
    return { candidateTargets, status: "ambiguous" };
  }
  const [entity] = matches;
  return entity
    ? { candidateTargets, entity, status: "matched" }
    : { candidateTargets, status: "missing" };
};

export { findEntity, type LookupResult };
