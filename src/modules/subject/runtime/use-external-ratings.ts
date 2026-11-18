import { useEffect, useRef, useState } from "preact/hooks";

import type { DoubanData } from "@/modules/subject/domain";
import { emptyRatingResults } from "@/modules/subject/resolve/types";
import type { RatingResultMap } from "@/modules/subject/resolve/types";

import { buildContext } from "../resolve/context";
import { resolveAll } from "../resolve/orchestrate";
import type { OnRatingUpdate } from "../resolve/orchestrate";

type ExternalRatingsState = {
  data: DoubanData;
  ratings: RatingResultMap;
};

const useExternalRatings = (
  data: DoubanData,
  onRatingUpdate?: OnRatingUpdate
): RatingResultMap => {
  const [state, setState] = useState<ExternalRatingsState>(() => ({
    data,
    ratings: emptyRatingResults(),
  }));
  const onRatingUpdateRef = useRef(onRatingUpdate);

  useEffect(() => {
    onRatingUpdateRef.current = onRatingUpdate;
  }, [onRatingUpdate]);

  useEffect(() => {
    const controller = new AbortController();
    const context = buildContext(data);
    setState((current) =>
      current.data === data ? current : { data, ratings: emptyRatingResults() }
    );

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
      onRatingUpdateRef.current?.(update);
    });

    return () => controller.abort();
  }, [data]);

  return state.data === data ? state.ratings : emptyRatingResults();
};

export { useExternalRatings };
