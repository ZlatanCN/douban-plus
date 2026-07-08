import { el } from "../../components";
import type { AccountActionGuard, ReviewVoteCallback } from "../../types";
import { reviewNumericId } from "./identity";
import { getReviewVotePersisted, persistReviewVote } from "./vote-state";
import type { ReviewVoteDirection } from "./vote-state";

type ReviewVotePair = {
  downBtn: HTMLButtonElement;
  upBtn: HTMLButtonElement;
};

const buildReviewVotePair = (
  rid: string,
  usefulInit: number,
  uselessInit: number,
  onVote: ReviewVoteCallback | undefined,
  canVote?: AccountActionGuard
): ReviewVotePair => {
  const persisted = getReviewVotePersisted(rid);
  let usefulCount = usefulInit;
  let uselessCount = uselessInit;
  let votedUp = persisted === "up";
  let votedDown = persisted === "down";
  let voting = false;

  const upBtn = el("button", {
    className: "atv-vote-btn up",
    text: `有用 ${usefulCount}`,
  });
  const downBtn = el("button", {
    className: "atv-vote-btn down",
    text: `没用 ${uselessCount}`,
  });

  const sync = (): void => {
    upBtn.textContent = `有用 ${usefulCount}`;
    downBtn.textContent = `没用 ${uselessCount}`;
    upBtn.classList.toggle("is-voted", votedUp);
    downBtn.classList.toggle("is-voted", votedDown);
  };

  const applyOptimisticVote = (type: ReviewVoteDirection): void => {
    if (type === "up") {
      if (votedDown) {
        uselessCount -= 1;
        votedDown = false;
      }
      usefulCount += 1;
      votedUp = true;
    } else {
      if (votedUp) {
        usefulCount -= 1;
        votedUp = false;
      }
      uselessCount += 1;
      votedDown = true;
    }
    sync();
  };

  const vote = async (type: ReviewVoteDirection): Promise<void> => {
    if (voting) {
      return;
    }
    if ((type === "up" && votedUp) || (type === "down" && votedDown)) {
      return;
    }
    if (!onVote) {
      return;
    }
    if (canVote && !canVote()) {
      return;
    }

    voting = true;
    const prev = { usefulCount, uselessCount, votedDown, votedUp };
    applyOptimisticVote(type);

    const apiType = type === "up" ? "useful" : "useless";
    const result = await onVote(reviewNumericId(rid), apiType);
    if (
      result.ok &&
      result.usefulCount !== undefined &&
      result.uselessCount !== undefined
    ) {
      ({ usefulCount, uselessCount } = result);
      persistReviewVote(rid, type);
    } else {
      ({ usefulCount, uselessCount } = prev);
      ({ votedUp, votedDown } = prev);
    }

    sync();
    voting = false;
  };

  upBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    void vote("up");
  });
  downBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    void vote("down");
  });

  sync();
  return { downBtn, upBtn };
};

export { buildReviewVotePair };
export type { ReviewVotePair };
