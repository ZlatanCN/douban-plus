import { render } from "preact";
import { vi } from "vitest";

import type { DoubanData } from "@/modules/subject/domain";
import type {
  OnRatingUpdate,
  RatingUpdate,
} from "@/modules/subject/resolve/orchestrate";
import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import { renderIntoRoot } from "../helpers/render";
import {
  makeData,
  mockNetwork,
  setupSubjectRuntimeHooks,
} from "./subject-runtime-test-utils";

type RatingOutcomeMap = Map<RatingUpdate["source"], RatingUpdate>;

const setupRatingOutcomeTest = (): void => setupSubjectRuntimeHooks();

const createRatingOutcomeCapture = () => {
  const outcomes: RatingOutcomeMap = new Map();
  const onRatingUpdate: OnRatingUpdate = (update) => {
    outcomes.set(update.source, update);
  };
  return { onRatingUpdate, outcomes };
};

const makeCrewGirlData = (): DoubanData =>
  makeData({
    info: {
      ...makeData().info,
      firstAired: "2026-11-16",
      imdb: "tt38218082",
      selectedSeason: "Season 1",
    },
    isTV: true,
    subjectId: "37516033",
    title: {
      full: "Crew Girl Season 1",
      original: "Crew Girl",
      primary: "Crew Girl",
      seasonLabel: "Season 1",
    },
  });

const waitForRatingOutcome = async (
  outcomes: RatingOutcomeMap,
  source: RatingUpdate["source"],
  reason: NonNullable<RatingUpdate["result"]["diagnostic"]>["reason"]
): Promise<RatingUpdate> => {
  let found: RatingUpdate | undefined;
  await vi.waitFor(() => {
    const update = outcomes.get(source);
    if (update?.result.diagnostic?.reason !== reason) {
      throw new Error(`Outcome does not yet contain ${source}:${reason}`);
    }
    found = update;
  });
  if (!found) {
    throw new Error(`Missing outcome for ${source}:${reason}`);
  }
  return found;
};

const outcomeRecords = (outcomes: RatingOutcomeMap) =>
  [...outcomes.values()].flatMap(({ result, source }) => {
    if (!result.diagnostic) {
      return [];
    }
    return [
      {
        ...result.diagnostic,
        hasRating:
          source === "imdb"
            ? Boolean(result.rating?.rating)
            : Boolean(result.rating),
        source,
      },
    ];
  });

const summarizeIdentityRequests = (
  requests: string[],
  imdbId: string,
  subjectId: string
) => ({
  sourceRequests: requests.filter(
    (url) =>
      url.startsWith("https://www.rottentomatoes.com/") ||
      url.startsWith("https://www.metacritic.com/")
  ),
  identityQueriesAreExact: requests
    .filter((url) => url.includes("wikidata.org/w/api.php"))
    .every((url) => {
      const search = new URL(url).searchParams.get("srsearch");
      return (
        search === null ||
        search === `haswbstatement:P345=${imdbId}` ||
        search === `haswbstatement:P4529=${subjectId}`
      );
    }),
});

const waitForOutcomeReport = async (
  outcomes: RatingOutcomeMap,
  source: RatingUpdate["source"],
  reason: NonNullable<RatingUpdate["result"]["diagnostic"]>["reason"]
): Promise<{ records: ReturnType<typeof outcomeRecords> }> => {
  await waitForRatingOutcome(outcomes, source, reason);
  return { records: outcomeRecords(outcomes) };
};

const mountSubjectRuntime = (
  data: DoubanData = makeData(),
  onRatingUpdate?: OnRatingUpdate
): HTMLElement =>
  renderIntoRoot(
    <SubjectPageRuntime
      data={data}
      doc={document}
      {...(onRatingUpdate ? { onRatingUpdate } : {})}
    />
  );

const unmountSubjectRuntime = (root: HTMLElement): void => render(null, root);

export {
  createRatingOutcomeCapture,
  makeCrewGirlData,
  mountSubjectRuntime,
  outcomeRecords,
  mockNetwork,
  setupRatingOutcomeTest,
  summarizeIdentityRequests,
  unmountSubjectRuntime,
  waitForRatingOutcome,
  waitForOutcomeReport,
  type RatingOutcomeMap,
};
