/* ── Extract Helpers ───────────────────────────────────── */
/* Shared utilities for all extract modules.                */

import { RE_COLON_WS, RE_SLASH_SEP, RE_WS_GLOBAL } from "../constants";
import { $$ } from "../utils/dom";

/**
 * Find a label <span.pl> by its text content within a root element.
 * Used by collectInfoTextAfter() and collectLinksAfter() internally,
 * also available standalone for callers that need the label element.
 */
function findLabel(
  root: HTMLElement | Document,
  label: string
): HTMLElement | null {
  if (!root) {
    return null;
  }
  const spans = $$<HTMLSpanElement>("span.pl", root);
  for (const s of spans) {
    const t = (s.textContent || "").replace(RE_COLON_WS, "");
    if (t === label) {
      return s;
    }
  }
  return null;
}

/**
 * Find a label and collect the adjacent text node content.
 * Walks nextSiblings until another .pl label or <br> is hit.
 *
 * @param trim  Default true. Pass false to keep leading/trailing whitespace.
 */
function collectInfoTextAfter(
  root: HTMLElement | Document,
  label: string,
  trim?: boolean
): string {
  const labelEl = findLabel(root, label);
  if (!labelEl) {
    return "";
  }

  let out = "";
  let n: ChildNode | null = labelEl.nextSibling;
  while (n) {
    if (n.nodeType === 1 && (n as HTMLElement).classList?.contains("pl")) {
      break;
    }
    if (n.nodeType === 1 && (n as HTMLElement).tagName === "BR") {
      break;
    }
    if (n.nodeType === 3) {
      out += n.nodeValue;
    } else if (n.nodeType === 1) {
      out += (n as HTMLElement).textContent || "";
    }
    n = n.nextSibling;
  }

  let result = out.replace(RE_SLASH_SEP, " / ").replace(RE_WS_GLOBAL, " ");
  if (trim !== false) {
    result = result.trim();
  }
  return result;
}

/**
 * Find a label and collect all <a> links in adjacent sibling nodes.
 * Walks nextSiblings until another .pl label or <br> is hit.
 */
function collectLinksAfter(
  root: HTMLElement | Document,
  label: string
): Array<{ text: string; href: string }> {
  const labelEl = findLabel(root, label);
  if (!labelEl) {
    return [];
  }

  const out: Array<{ text: string; href: string }> = [];
  let n: ChildNode | null = labelEl.nextSibling;
  while (n) {
    if (n.nodeType === 1 && (n as HTMLElement).classList?.contains("pl")) {
      break;
    }
    if (n.nodeType === 1 && (n as HTMLElement).tagName === "BR") {
      break;
    }
    if (n.nodeType === 1) {
      const el = n as HTMLElement;
      const anchors = el.tagName === "A" ? [el] : $$("a", el);
      for (const a of anchors) {
        const t = (a.textContent || "").trim();
        if (t) {
          out.push({ text: t, href: (a as HTMLAnchorElement).href || "" });
        }
      }
    }
    n = n.nextSibling;
  }
  return out;
}

/* ── Exports ──────────────────────────────────────────── */

export { collectInfoTextAfter, collectLinksAfter, findLabel };
