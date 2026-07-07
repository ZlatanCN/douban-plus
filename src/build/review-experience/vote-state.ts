import { createCache } from "../../utils/cache";
import { reviewNumericId } from "./identity";

type ReviewVoteDirection = "up" | "down";

const voteCache = createCache<ReviewVoteDirection>(
  "atv:review:vote",
  365 * 24 * 60 * 60 * 1000
);

const getReviewVotePersisted = (rid: string): ReviewVoteDirection | null =>
  voteCache.get(reviewNumericId(rid)) ?? null;

const persistReviewVote = (rid: string, dir: ReviewVoteDirection): void => {
  voteCache.set(reviewNumericId(rid), dir);
};

export { getReviewVotePersisted, persistReviewVote };
export type { ReviewVoteDirection };
