/* ── Interest State Extractor ────────────────────────── */
/* Wish/watching/collect interest state from Douban page. */

import type { InterestState } from "@/types";

import {
  findInterestAnchors,
  findInterestButtons,
  findInterestRoot,
  isInterestActive,
  matchInterestText,
} from "./interest-dom";

/* ── S3 / S2 State Detection ────────────────────────── */

/**
 * Detect interest state from S3 (new) Douban DOM structure.
 * Parses the inline rating, date, comment, and usefulCount.
 */
const detectS3State = (
  root: HTMLElement
): {
  comment: string;
  date: string;
  hasWatching: boolean;
  rating: number;
  status: InterestState["status"];
  usefulCount: string;
} => {
  let status: InterestState["status"] = "none";
  const allTextEls = root.querySelectorAll<HTMLElement>("span, div, a");
  for (const el of allTextEls) {
    const t = (el.textContent || "").trim();
    const s = matchInterestText(t, true);
    if (s) {
      status = s;
      break;
    }
  }

  const hasWatching = [...allTextEls].some((el) =>
    /^(?:正在?)?在看/u.test((el.textContent || "").trim())
  );

  const ratingInput = root.querySelector<HTMLInputElement>("#n_rating");
  const rating = ratingInput ? Math.trunc(Number(ratingInput.value)) : 0;

  const dateEl = root.querySelector<HTMLElement>(".collection_date");
  const date = dateEl ? (dateEl.textContent || "").trim() : "";

  // User's short review: the bare <span> inside .j a_stars after #rating.
  // textContent merges all descendant text ("评论 1有用"), so we walk
  // childNodes to grab only direct text, then separately extract the .pl
  // vote-count span ("1有用").
  const commentEl = root.querySelector<HTMLElement>(
    ".j.a_stars > span:not(.mr10):not(#rating)"
  );
  let comment = "";
  let usefulCount = "";
  if (commentEl) {
    const voteEl = commentEl.querySelector<HTMLElement>(".pl");
    usefulCount = voteEl ? (voteEl.textContent || "").trim() : "";
    // Direct text nodes only — skip child elements like .pl
    for (const node of commentEl.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        comment += node.textContent || "";
      }
    }
    comment = comment.trim();
  }

  return { comment, date, hasWatching, rating, status, usefulCount };
};

/**
 * Detect interest status from S2 (legacy) Douban DOM structure.
 * Checks anchor text and CSS class for active state.
 */
const detectS2Status = (
  anchors: HTMLAnchorElement[]
): { hasWatching: boolean; status: InterestState["status"] } => {
  let status: InterestState["status"] = "none";
  let hasWatching = false;
  for (const a of anchors) {
    const text = (a.textContent || "").trim();
    if (text === "在看") {
      hasWatching = true;
    }
    if (status !== "none") {
      continue;
    }
    const s = matchInterestText(text);
    if (s && isInterestActive(a)) {
      status = s;
    }
  }
  return { hasWatching, status };
};

/* ── Main Extractor ─────────────────────────────────── */

/**
 * Extract the user's interest state (wish/do/collect) from the Douban page.
 * Handles logged-out, S3 (new DOM), and S2 (legacy DOM) paths.
 */
const extractInterestState = (doc: Document): InterestState => {
  const ck = (doc.cookie.match(/\bck=(?<ck>[^;]+)/u) || [])[1] || "";
  const loggedIn = !!ck;
  const root = findInterestRoot(doc);
  const anchors = findInterestAnchors(doc, root);

  if (!loggedIn) {
    return {
      ck,
      comment: "",
      date: "",
      hasWatching: anchors.some((a) =>
        /^在看$/u.test((a.textContent || "").trim())
      ),
      loggedIn: false,
      marked: false,
      rating: 0,
      status: "none",
      tags: [],
      usefulCount: "",
    };
  }

  if (root) {
    const s3 = detectS3State(root as HTMLElement);
    if (s3.status !== "none") {
      return {
        ck,
        comment: s3.comment,
        date: s3.date,
        hasWatching: s3.hasWatching,
        loggedIn: true,
        marked: true,
        rating: s3.rating,
        status: s3.status,
        tags: [],
        usefulCount: s3.usefulCount,
      };
    }
  }

  const s2 = detectS2Status(anchors);
  return {
    ck,
    comment: "",
    date: "",
    hasWatching: s2.hasWatching,
    loggedIn: true,
    marked: false,
    rating: 0,
    status: s2.status,
    tags: [],
    usefulCount: "",
  };
};

/**
 * Proxy a marking intent to Douban's original control.
 * DOM variants and unavailable controls are an implementation detail.
 */
const proxyInterestAction = (
  doc: Document,
  status: Exclude<InterestState["status"], "none">
): void => {
  findInterestButtons(doc)[status]?.click();
};

/* ── Exports ────────────────────────────────────────── */

export { extractInterestState, proxyInterestAction };
