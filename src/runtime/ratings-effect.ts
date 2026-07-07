import {
  applyImdbResult,
  applyMcResult,
  applyRtResult,
} from "../resolve/apply";
import { buildContext } from "../resolve/context";
import { resolveAll } from "../resolve/orchestrate";

const resolveAllRatings = async (
  imdbId: string,
  isTV: boolean,
  doc: Document = document
): Promise<void> => {
  const ctx = buildContext(imdbId, isTV, doc);
  const results = await resolveAll(ctx);
  applyImdbResult(results.imdb);
  applyRtResult(results.rt);
  applyMcResult(results.mc);
};

const startRatingsEffect = (
  imdbId: string | null,
  isTV: boolean,
  doc: Document = document
): void => {
  if (imdbId) {
    void resolveAllRatings(imdbId, isTV, doc);
  }
};

export { resolveAllRatings, startRatingsEffect };
