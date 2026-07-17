/* ── Interest State Extractor ────────────────────────── */
/* Wish/watching/collect interest state from Douban page. */

import { RE_INTEREST_ACTIVE } from "@/constants";
import type { InterestState } from "@/types";
import { $, $$ } from "@/utils/dom";
import { normalizeInterestTags } from "@/utils/interest-tags";

/* ── DOM Locators ───────────────────────────────────── */

const findInterestRoot = (doc: Document): HTMLElement | null =>
  $("#interest_sect_level", doc) || $("#interest_sectl", doc);

const findInterestAnchors = (
  doc: Document,
  root = findInterestRoot(doc)
): HTMLAnchorElement[] => (root ? $$<HTMLAnchorElement>("a", root) : []);

const isInterestActive = (anchor: HTMLAnchorElement | null): boolean => {
  if (!anchor) {
    return false;
  }
  const classes = `${anchor.className || ""} ${anchor.parentElement?.className || ""}`;
  return RE_INTEREST_ACTIVE.test(classes);
};

/* ── Status Matchers ────────────────────────────────── */

/**
 * S3 (new Douban) status text uses rich, disambiguated phrasings
 * ("已看过", "我看过这部电影"). These are the only patterns consulted when
 * scanning the broad S3 DOM, so a stray bare word elsewhere can never be
 * mistaken for the user's interest.
 */
const matchS3Status = (text: string): InterestState["status"] | null => {
  if (text.includes("已看过")) {
    return "collect";
  }
  if (text.includes("已想看")) {
    return "wish";
  }
  if (text.includes("已在看")) {
    return "do";
  }
  if (/^我看过(?:这部电影|这部电视剧)/u.test(text)) {
    return "collect";
  }
  if (/^我想看(?:这部电影|这部电视剧)/u.test(text)) {
    return "wish";
  }
  if (/^(?:我在看|我正在看)(?:这部电影|这部电视剧)?/u.test(text)) {
    return "do";
  }
  return null;
};

/**
 * Bare status words carried by S2 (legacy Douban) anchors ("看过", "想看",
 * "在看"). Used only as a fallback after the S3 rich patterns miss.
 */
const matchBareStatus = (text: string): InterestState["status"] | null => {
  if (/^看过$/u.test(text)) {
    return "collect";
  }
  if (/^想看$/u.test(text)) {
    return "wish";
  }
  if (/^(?:正在?)?在看$/u.test(text)) {
    return "do";
  }
  return null;
};

/**
 * Matches an interest status from a single text token, trying the S3 rich
 * phrasings first and falling back to the S2 bare words only when no rich
 * phrasing matched. Used by the legacy anchor path.
 */
const matchRichOrBareStatus = (text: string): InterestState["status"] | null =>
  matchS3Status(text) ?? matchBareStatus(text);

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
    const s = matchS3Status((el.textContent || "").trim());
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
    ".j.a_stars > span:not(.mr10):not(#rating):not(.color_gray)"
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
    const s = matchRichOrBareStatus(text);
    if (s && isInterestActive(a)) {
      status = s;
    }
  }
  return { hasWatching, status };
};

const extractInterestTags = (root: HTMLElement): string[] => {
  const text =
    root.querySelector<HTMLElement>(".color_gray")?.textContent || "";
  const match = /^标签\s*[:：]\s*(?<tags>.+)$/u.exec(text.trim());
  if (!match?.groups?.tags) {
    return [];
  }
  return normalizeInterestTags(match.groups.tags);
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
        tags: extractInterestTags(root as HTMLElement),
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

export { extractInterestState };
