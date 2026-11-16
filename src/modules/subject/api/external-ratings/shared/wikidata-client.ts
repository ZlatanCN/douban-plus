import { gmGetResponse } from "@/shared/utils/request";

type SearchResult =
  | { entityIds: string[]; status: "matched" }
  | { status: "ambiguous" | "missing" };
type EntityCandidates<T> =
  | { entities: T[]; status: "matched" }
  | { status: "ambiguous" | "missing" };
type WikidataResponse = { error?: unknown };
type EntityName = { value?: unknown };
type EntityNames = {
  aliases?: Record<string, EntityName[]>;
  labels?: Record<string, EntityName>;
};

const API_URL = "https://www.wikidata.org/w/api.php";
const REQUEST_TIMEOUT = 8000;

const entityReference = (value: unknown): string | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  const id = Reflect.get(value, "id");
  return typeof id === "string" ? id : null;
};

const throwApiError = (data: WikidataResponse): void => {
  if (data.error !== undefined) {
    throw new Error("Wikidata API error");
  }
};

const searchEntityIds = async (
  property: string,
  value: string,
  signal: AbortSignal
): Promise<SearchResult> => {
  const url = new URL(API_URL);
  url.search = new URLSearchParams({
    action: "query",
    format: "json",
    list: "search",
    origin: "*",
    srlimit: "50",
    srnamespace: "0",
    srsearch: `haswbstatement:${property}=${value}`,
  }).toString();
  const response = await gmGetResponse(url.href, undefined, {
    signal,
    timeoutMs: REQUEST_TIMEOUT,
  });
  const data = JSON.parse(response.responseText) as {
    continue?: Record<string, string>;
    error?: unknown;
    query?: { search?: { title?: string }[] };
  };
  throwApiError(data);
  if (data.continue) {
    return { status: "ambiguous" };
  }
  const entityIds = [
    ...new Set(
      (data.query?.search ?? [])
        .map((item) => item.title)
        .filter((id): id is string => /^Q\d+$/u.test(id ?? ""))
    ),
  ];
  return entityIds.length > 0
    ? { entityIds, status: "matched" }
    : { status: "missing" };
};

const fetchEntities = async <T>(
  entityIds: string[],
  signal: AbortSignal
): Promise<Record<string, T>> => {
  if (entityIds.length === 0) {
    return {};
  }
  const url = new URL(API_URL);
  url.search = new URLSearchParams({
    action: "wbgetentities",
    format: "json",
    ids: entityIds.join("|"),
    origin: "*",
    props: "claims",
  }).toString();
  const response = await gmGetResponse(url.href, undefined, {
    signal,
    timeoutMs: REQUEST_TIMEOUT,
  });
  const data = JSON.parse(response.responseText) as WikidataResponse & {
    entities?: Record<string, T>;
  };
  throwApiError(data);
  return data.entities ?? {};
};

const fetchEntityNames = async (
  entityIds: string[],
  signal: AbortSignal
): Promise<Record<string, string[]>> => {
  const uniqueIds = [...new Set(entityIds.filter((id) => /^Q\d+$/u.test(id)))];
  if (uniqueIds.length === 0) {
    return {};
  }
  const url = new URL(API_URL);
  url.search = new URLSearchParams({
    action: "wbgetentities",
    format: "json",
    ids: uniqueIds.slice(0, 50).join("|"),
    origin: "*",
    props: "labels|aliases",
  }).toString();
  const response = await gmGetResponse(url.href, undefined, {
    signal,
    timeoutMs: REQUEST_TIMEOUT,
  });
  const data = JSON.parse(response.responseText) as WikidataResponse & {
    entities?: Record<string, EntityNames>;
  };
  throwApiError(data);
  return Object.fromEntries(
    Object.entries(data.entities ?? {}).map(([id, entity]) => [
      id,
      [
        ...new Set([
          ...Object.values(entity.labels ?? {}).flatMap((label) =>
            typeof label.value === "string" ? [label.value] : []
          ),
          ...Object.values(entity.aliases ?? {}).flatMap((aliases) =>
            aliases.flatMap((alias) =>
              typeof alias.value === "string" ? [alias.value] : []
            )
          ),
        ]),
      ],
    ])
  );
};

const findEntityCandidates = async <T>(
  property: string,
  value: string,
  signal: AbortSignal
): Promise<EntityCandidates<T>> => {
  const search = await searchEntityIds(property, value, signal);
  if (search.status !== "matched") {
    return search;
  }
  const fetched = await fetchEntities<T>(search.entityIds, signal);
  const entities = Object.values(fetched);
  return entities.length > 0
    ? { entities, status: "matched" }
    : { status: "missing" };
};

export {
  entityReference,
  fetchEntityNames,
  fetchEntities,
  findEntityCandidates,
  type EntityCandidates,
};
