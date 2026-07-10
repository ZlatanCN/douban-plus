import {
  RE_COLLECT,
  RE_COLLECT_EXACT,
  RE_DO,
  RE_DO_EXACT,
  RE_INTEREST_ACTIVE,
  RE_WISH,
  RE_WISH_EXACT,
} from "@/constants";
import type { InterestState } from "@/types";
import { $, $$ } from "@/utils/dom";

type InterestButtons = {
  collect: HTMLAnchorElement | null;
  do: HTMLAnchorElement | null;
  wish: HTMLAnchorElement | null;
};

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
  if (/^我看过(?:这部电影|这部电视剧)/u.test(text)) {
    return "collect";
  }
  if (/^我想看(?:这部电影|这部电视剧)/u.test(text)) {
    return "wish";
  }
  if (/^(?:我在看|我正在看)(?:这部电影|这部电视剧)?/u.test(text)) {
    return "do";
  }
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

const findInterestRoot = (doc: Document): HTMLElement | null =>
  $("#interest_sect_level", doc) || $("#interest_sectl", doc);

const findInterestAnchors = (
  doc: Document,
  root = findInterestRoot(doc)
): HTMLAnchorElement[] => (root ? $$<HTMLAnchorElement>("a", root) : []);

const findInterestButtons = (doc: Document): InterestButtons => {
  const result: InterestButtons = { collect: null, do: null, wish: null };
  const scan = (
    anchors: HTMLAnchorElement[],
    doRe: RegExp,
    wishRe: RegExp,
    collectRe: RegExp
  ): void => {
    for (const anchor of anchors) {
      const text = (anchor.textContent || "").trim();
      if (!result.do && doRe.test(text)) {
        result.do = anchor;
      }
      if (!result.wish && wishRe.test(text)) {
        result.wish = anchor;
      }
      if (!result.collect && collectRe.test(text)) {
        result.collect = anchor;
      }
    }
  };

  scan(findInterestAnchors(doc), RE_DO, RE_WISH, RE_COLLECT);
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

const isInterestActive = (anchor: HTMLAnchorElement | null): boolean => {
  if (!anchor) {
    return false;
  }
  const classes = `${anchor.className || ""} ${anchor.parentElement?.className || ""}`;
  return RE_INTEREST_ACTIVE.test(classes);
};

export {
  findInterestAnchors,
  findInterestButtons,
  findInterestRoot,
  isInterestActive,
  matchInterestText,
};
