import { useEffect, useMemo, useState } from "preact/hooks";

import type { FetchImdbResult } from "@/modules/subject/api/external-ratings/imdb";
import type { DoubanData, McRating, RtRating } from "@/modules/subject/domain";
import { emptyRatingResults } from "@/modules/subject/resolve/types";
import type {
  RatingResultMap,
  SourceResult,
} from "@/modules/subject/resolve/types";

import { buildContext } from "../resolve/context";
import { resolveAll } from "../resolve/orchestrate";
import {
  createRatingDiagnostics,
  getUserscriptApi,
} from "./rating-diagnostics";

type ExternalRatingsState = {
  data: DoubanData;
  ratings: RatingResultMap;
};

type DiagnosticUpdate =
  | { result: SourceResult<FetchImdbResult>; source: "imdb" }
  | { result: SourceResult<McRating>; source: "mc" }
  | { result: SourceResult<RtRating>; source: "rt" };

const useExternalRatings = (data: DoubanData): RatingResultMap => {
  const [state, setState] = useState<ExternalRatingsState>(() => ({
    data,
    ratings: emptyRatingResults(),
  }));
  const diagnostics = useMemo(
    () => createRatingDiagnostics(getUserscriptApi()),
    []
  );

  useEffect(() => () => diagnostics.dispose(), [diagnostics]);

  useEffect(() => {
    const controller = new AbortController();
    const context = buildContext(data);
    diagnostics.beginPage({
      imdbId: context.imdbId,
      kind: context.kind,
      season: context.season,
      subjectId: context.subjectId,
    });
    setState((current) =>
      current.data === data ? current : { data, ratings: emptyRatingResults() }
    );

    let captureReady = false;
    const pendingUpdates = new Map<
      DiagnosticUpdate["source"],
      DiagnosticUpdate
    >();
    const capture = (update: DiagnosticUpdate): void => {
      if (update.result.diagnostic) {
        diagnostics.record({
          ...update.result.diagnostic,
          hasRating:
            update.source === "imdb"
              ? Boolean(update.result.rating?.rating)
              : Boolean(update.result.rating),
          source: update.source,
        });
      }
    };
    void diagnostics.initialize().then(() => {
      captureReady = true;
      for (const update of pendingUpdates.values()) {
        capture(update);
      }
      pendingUpdates.clear();
      return true;
    });
    void resolveAll(context, controller.signal, (update) => {
      setState((current) => {
        if (current.data !== data) {
          return current;
        }
        switch (update.source) {
          case "imdb": {
            return {
              ...current,
              ratings: { ...current.ratings, imdb: update.result },
            };
          }
          case "mc": {
            return {
              ...current,
              ratings: { ...current.ratings, mc: update.result },
            };
          }
          case "rt": {
            return {
              ...current,
              ratings: { ...current.ratings, rt: update.result },
            };
          }
          default: {
            return current;
          }
        }
      });
      if (!captureReady) {
        pendingUpdates.set(update.source, update);
        return;
      }
      capture(update);
    });

    return () => controller.abort();
  }, [data, diagnostics]);

  return state.data === data ? state.ratings : emptyRatingResults();
};

export { useExternalRatings };
