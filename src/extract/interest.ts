/* ── Interest State Extractor ────────────────────────── */
/* Wish/watching/collect interest state from Douban page. */

import {
  RE_COLLECT,
  RE_COLLECT_EXACT,
  RE_DO,
  RE_DO_EXACT,
  RE_INTEREST_ACTIVE,
  RE_WISH,
  RE_WISH_EXACT,
} from "../constants";
import type { InterestState } from "../types";
import { $, $$ } from "../utils/dom";

/* ── Internal Types ─────────────────────────────────── */

/**
 * Found interest (wish/do/collect) DOM anchor elements.
 * Used for proxy-clicking original Douban buttons when not logged in.
 */
interface InterestButtons {
  do: HTMLAnchorElement | null;
  wish: HTMLAnchorElement | null;
  collect: HTMLAnchorElement | null;
}

/* ── Internal Helpers ───────────────────────────────── */

/**
 * Match visible interest status text against known patterns.
 * @param s3Only — when true, only match S3 full-text patterns ("我看过这部电影")
 */
const matchInterestText = (
  text: string,
  s3Only = false
): InterestState["status"] | null => {
  if (text.includes("已看过")) {
    return "collect";
  }
  if (text.includes("已想看")) {
    return "wish";
  }
  if (text.includes("已在看")) {
    return "do";
  }
  // S3 full text: "我看过这部电影" / "我看过这部电视剧"
  if (/^我看过(?:这部电影|这部电视剧)/u.test(text)) {
    return "collect";
  }
  if (/^我想看(?:这部电影|这部电视剧)/u.test(text)) {
    return "wish";
  }
  if (/^(?:我在看|我正在看)(?:这部电影|这部电视剧)?/u.test(text)) {
    return "do";
  }
  // S1/S2 anchor text — only match for S2 detection, NOT for S3
  if (!s3Only) {
    if (/^看过$/u.test(text)) {
      return "collect";
    }
    if (/^想看$/u.test(text)) {
      return "wish";
    }
    if (/^(?:正在?)?在看$/u.test(text)) {
      return "do";
    }
  }
  return null;
};

/* ── Interest Button Detection ──────────────────────── */

/**
 * Find wish (想看) and collect (看过) interest buttons.
 * Tries the primary interest section first, then falls back to secondary selectors.
 */
const findInterestButtons = (doc: Document): InterestButtons => {
  const result: InterestButtons = { collect: null, do: null, wish: null };
  const root = $("#interest_sect_level", doc) || $("#interest_sectl", doc);
  const anchors = root ? $$<HTMLAnchorElement>("a", root) : [];
  const scan = (
    list: HTMLAnchorElement[],
    doRe: RegExp,
    wishRe: RegExp,
    collectRe: RegExp
  ): void => {
    for (const a of list) {
      const t = (a.textContent || "").trim();
      if (!result.do && doRe.test(t)) {
        result.do = a;
      }
      if (!result.wish && wishRe.test(t)) {
        result.wish = a;
      }
      if (!result.collect && collectRe.test(t)) {
        result.collect = a;
      }
    }
  };
  scan(anchors, RE_DO, RE_WISH, RE_COLLECT);
  if (!result.do || !result.wish || !result.collect) {
    scan(
      $$<HTMLAnchorElement>("#interest_sectl a", doc),
      RE_DO_EXACT,
      RE_WISH_EXACT,
      RE_COLLECT_EXACT
    );
  }
  return result;
};

/**
 * Check if an interest button (wish/collect) is in active state.
 * Checks both the element and its parent for active classes.
 */
const isInterestActive = (anchor: HTMLAnchorElement | null): boolean => {
  if (!anchor) {
    return false;
  }
  const cls = `${anchor.className || ""} ${anchor.parentElement?.className || ""}`;
  return RE_INTEREST_ACTIVE.test(cls);
};

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
    if (s) {
      const cls = `${a.className} ${a.parentElement?.className || ""}`;
      if (RE_INTEREST_ACTIVE.test(cls)) {
        status = s;
      }
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
  const root = $("#interest_sect_level", doc) || $("#interest_sectl", doc);
  const anchors = root ? $$<HTMLAnchorElement>("a", root) : [];

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

/* ── Exports ────────────────────────────────────────── */

export { extractInterestState, findInterestButtons, isInterestActive };
