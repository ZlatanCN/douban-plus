import { useEffect, useState } from "preact/hooks";

import type { DoubanData } from "@/modules/subject/domain";
import { emptyRatingResults } from "@/modules/subject/resolve/types";
import type { RatingResultMap } from "@/modules/subject/resolve/types";

import { buildContext } from "../resolve/context";
import { resolveAll } from "../resolve/orchestrate";

type ExternalRatingsState = {
  data: DoubanData;
  ratings: RatingResultMap;
};

const useExternalRatings = (data: DoubanData): RatingResultMap => {
  const [state, setState] = useState<ExternalRatingsState>(() => ({
    data,
    ratings: emptyRatingResults(),
  }));

  useEffect(() => {
    const controller = new AbortController();
    setState((current) =>
      current.data === data ? current : { data, ratings: emptyRatingResults() }
    );

    void resolveAll(buildContext(data), controller.signal, (update) => {
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
    });

    return () => controller.abort();
  }, [data]);

  return state.data === data ? state.ratings : emptyRatingResults();
};

export { useExternalRatings };
