import { RE_INTEREST_ACTIVE } from "@/constants";
import type { InterestState } from "@/types";
import { $, $$ } from "@/utils/dom";

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

const isInterestActive = (anchor: HTMLAnchorElement | null): boolean => {
  if (!anchor) {
    return false;
  }
  const classes = `${anchor.className || ""} ${anchor.parentElement?.className || ""}`;
  return RE_INTEREST_ACTIVE.test(classes);
};

export {
  findInterestAnchors,
  findInterestRoot,
  isInterestActive,
  matchInterestText,
};
