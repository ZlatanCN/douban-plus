import { useEffect, useState } from "preact/hooks";

import { fetchSubjectSuggestions } from "@/api/subject-suggestions";
import type { SubjectSuggestion } from "@/api/subject-suggestions";

const QUERY_DEBOUNCE_MS = 300;
const MAX_SUGGESTIONS = 5;

type SuggestionRequest =
  | { status: "idle" }
  | { query: string; status: "loading" }
  | { query: string; status: "ready"; suggestions: SubjectSuggestion[] }
  | { query: string; status: "failed" };

/**
 * Owns the suggestion request lifecycle: debounce, fetch, cancel, and the
 * race-condition alignment between the current query and the in-flight
 * request. Returns the already-aligned {@link SuggestionRequest} so callers
 * never need to know whether `request.query` matches the current input — the
 * "query changed but the hook hasn't caught up" gap is reported as `loading`,
 * not as a stale `ready` result.
 */
const useSubjectSuggestionRequest = (
  normalizedQuery: string
): SuggestionRequest => {
  const [request, setRequest] = useState<SuggestionRequest>({ status: "idle" });

  useEffect(() => {
    if (!normalizedQuery) {
      setRequest({ status: "idle" });
      return;
    }

    const controller = new AbortController();
    setRequest({ query: normalizedQuery, status: "loading" });
    const requestSuggestions = async (): Promise<void> => {
      try {
        const receivedSuggestions = await fetchSubjectSuggestions(
          normalizedQuery,
          controller.signal
        );
        if (!controller.signal.aborted) {
          setRequest({
            query: normalizedQuery,
            status: "ready",
            suggestions: receivedSuggestions.slice(0, MAX_SUGGESTIONS),
          });
        }
      } catch {
        if (!controller.signal.aborted) {
          setRequest({ query: normalizedQuery, status: "failed" });
        }
      }
    };
    const timeout = window.setTimeout(() => {
      void requestSuggestions();
    }, QUERY_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [normalizedQuery]);

  const requestMatchesQuery =
    request.status !== "idle" && request.query === normalizedQuery;
  return normalizedQuery && !requestMatchesQuery
    ? { query: normalizedQuery, status: "loading" }
    : request;
};

export { useSubjectSuggestionRequest, type SuggestionRequest };
