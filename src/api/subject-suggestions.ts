type SubjectSuggestion = {
  episode: string | null;
  id: string;
  imageUrl: string | null;
  originalTitle: string | null;
  title: string;
  url: string;
  year: string | null;
};

type CachedSuggestions = {
  expiresAt: number;
  suggestions: SubjectSuggestion[];
};

const CACHE_DURATION_MS = 2 * 60 * 1000;
const subjectSuggestionCache = new Map<string, CachedSuggestions>();
const subjectPathPattern = /^\/subject\/(?<subjectId>\d+)\/?$/u;

const normalizeSubjectQuery = (query: string): string =>
  query.trim().replaceAll(/\s+/gu, " ");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const optionalText = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const validImageUrl = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".doubanio.com")
      ? value
      : null;
  } catch {
    return null;
  }
};

const validSubjectUrl = (value: unknown, id: string): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const url = new URL(value);
    const subjectId = subjectPathPattern.exec(url.pathname)?.groups?.subjectId;
    return url.protocol === "https:" &&
      url.hostname === "movie.douban.com" &&
      subjectId === id
      ? value
      : null;
  } catch {
    return null;
  }
};

const toSubjectSuggestion = (value: unknown): SubjectSuggestion | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = optionalText(value.id);
  const title = optionalText(value.title);
  if (!id || !/^\d+$/u.test(id) || !title) {
    return null;
  }

  const url = validSubjectUrl(value.url, id);
  if (!url) {
    return null;
  }

  return {
    episode: optionalText(value.episode),
    id,
    imageUrl: validImageUrl(value.img),
    originalTitle: optionalText(value.sub_title),
    title,
    url,
    year: optionalText(value.year),
  };
};

const parseSubjectSuggestions = (value: unknown): SubjectSuggestion[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((candidate) => {
    const suggestion = toSubjectSuggestion(candidate);
    return suggestion ? [suggestion] : [];
  });
};

const fetchSubjectSuggestions = async (
  query: string,
  signal?: AbortSignal
): Promise<SubjectSuggestion[]> => {
  const normalizedQuery = normalizeSubjectQuery(query);
  if (!normalizedQuery) {
    return [];
  }

  const cached = subjectSuggestionCache.get(normalizedQuery);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.suggestions;
  }

  const response = await fetch(
    `/j/subject_suggest?q=${encodeURIComponent(normalizedQuery)}`,
    { signal }
  );
  if (!response.ok) {
    throw new Error("Douban subject suggestions request failed.");
  }

  const suggestions = parseSubjectSuggestions(await response.json());
  subjectSuggestionCache.set(normalizedQuery, {
    expiresAt: Date.now() + CACHE_DURATION_MS,
    suggestions,
  });
  return suggestions;
};

export {
  fetchSubjectSuggestions,
  normalizeSubjectQuery,
  type SubjectSuggestion,
};
