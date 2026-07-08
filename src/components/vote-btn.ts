import { ICON_THUMB } from "../constants";
import { el } from "./dom-factory";

/* ── Types ────────────────────────────────────────────── */

type VoteBtnOptions = {
  canVote?: () => boolean;
  cid: string;
  count: number;
  voted: boolean;
  className: string;
  onVote: (cid: string) => Promise<{ ok: boolean; count?: number }>;
};

/** Extended button with setVoteState for external state sync */
type VoteButtonElement = HTMLButtonElement & {
  setVoteState: (voted: boolean, count: number) => void;
};

/* ── buildVoteBtn ─────────────────────────────────────── */

const buildVoteBtn = ({
  cid,
  canVote,
  count: initialCount,
  voted: initialVoted,
  className,
  onVote,
}: VoteBtnOptions): VoteButtonElement => {
  let count = initialCount;
  let voted = initialVoted;

  const countSpan = el("span", { text: String(count) });
  const btn = el("button", { attrs: { type: "button" }, className }, [
    el("span", { html: ICON_THUMB }),
    countSpan,
  ]) as VoteButtonElement;

  if (voted) {
    btn.classList.add("is-voted");
  }

  const animateBtn = (): void => {
    btn.style.transform = "scale(1.2)";
    requestAnimationFrame(() => {
      btn.style.transform = "";
    });
  };

  btn.addEventListener("click", async () => {
    if (!cid) {
      return;
    }
    if (canVote && !canVote()) {
      return;
    }
    if (voted) {
      return;
    }

    voted = true;
    count += 1;
    countSpan.textContent = String(count);
    btn.classList.add("is-voted");
    animateBtn();

    const result = await onVote(cid);
    if (result.ok && result.count !== undefined) {
      ({ count } = result);
      countSpan.textContent = String(count);
    } else {
      voted = false;
      count -= 1;
      countSpan.textContent = String(count);
      btn.classList.remove("is-voted");
    }
  });

  /* External sync — allows another vote btn instance (e.g. overlay)
     to push its state back to this button. */
  btn.setVoteState = (newVoted: boolean, newCount: number): void => {
    voted = newVoted;
    count = newCount;
    countSpan.textContent = String(count);
    btn.classList.toggle("is-voted", voted);
  };

  return btn;
};

export { buildVoteBtn };
export type { VoteBtnOptions, VoteButtonElement };
