import { gmGetResponse } from "@/shared/utils/request";

import { hasIdentity } from "./metacritic-wikidata-claims";
import type { Entity } from "./metacritic-wikidata-claims";

type LookupResult =
  | { entity: Entity; status: "matched" }
  | { status: "ambiguous" | "missing" };

const API_URL = "https://www.wikidata.org/w/api.php";
const REQUEST_TIMEOUT = 8000;

const fetchEntity = async (
  id: string,
  signal: AbortSignal
): Promise<Entity | null> => {
  const url = new URL(API_URL);
  url.search = new URLSearchParams({
    action: "wbgetentities",
    format: "json",
    ids: id,
    origin: "*",
    props: "claims",
  }).toString();
  const response = await gmGetResponse(url.href, undefined, {
    signal,
    timeoutMs: REQUEST_TIMEOUT,
  });
  const data = JSON.parse(response.responseText) as {
    entities?: Record<string, Entity>;
  };
  return data.entities?.[id] ?? null;
};

const findEntity = async (
  property: "P345" | "P4529",
  value: string,
  signal: AbortSignal
): Promise<LookupResult> => {
  const searchUrl = new URL(API_URL);
  searchUrl.search = new URLSearchParams({
    action: "query",
    format: "json",
    list: "search",
    origin: "*",
    srlimit: "50",
    srnamespace: "0",
    srsearch: `haswbstatement:${property}=${value}`,
  }).toString();
  const searchResponse = await gmGetResponse(searchUrl.href, undefined, {
    signal,
    timeoutMs: REQUEST_TIMEOUT,
  });
  const search = JSON.parse(searchResponse.responseText) as {
    continue?: Record<string, string>;
    query?: { search?: { title?: string }[] };
  };
  if (search.continue) {
    return { status: "ambiguous" };
  }
  const ids = [
    ...new Set(
      (search.query?.search ?? [])
        .map((item) => item.title)
        .filter((id): id is string => /^Q\d+$/u.test(id ?? ""))
    ),
  ];
  if (ids.length === 0) {
    return { status: "missing" };
  }
  const claimsUrl = new URL(API_URL);
  claimsUrl.search = new URLSearchParams({
    action: "wbgetentities",
    format: "json",
    ids: ids.join("|"),
    origin: "*",
    props: "claims",
  }).toString();
  const claimsResponse = await gmGetResponse(claimsUrl.href, undefined, {
    signal,
    timeoutMs: REQUEST_TIMEOUT,
  });
  const data = JSON.parse(claimsResponse.responseText) as {
    entities?: Record<string, Entity>;
  };
  const matches = Object.values(data.entities ?? {}).filter((entity) =>
    hasIdentity(entity, property, value)
  );
  if (matches.length > 1) {
    return { status: "ambiguous" };
  }
  const [entity] = matches;
  return entity ? { entity, status: "matched" } : { status: "missing" };
};

export { fetchEntity, findEntity };
export type { LookupResult };
