/* ── Subject rank label extractor ──────────────────────── */

import type { RankLabel } from "@/modules/subject/domain";
import { $ } from "@/shared/utils/dom";

/**
 * Extract the optional Douban collection ranking displayed beside a subject.
 */
const extractRankLabel = (doc: Document): RankLabel | null => {
  const label = $(".rank-label", doc);
  const link = $<HTMLAnchorElement>(".rank-label-link a", label ?? doc);
  const position = $(".rank-label-no", label ?? doc)?.textContent?.trim() || "";
  const title = link?.textContent?.trim() || "";
  const href = link?.href || "";

  if (!label || !position || !title || !href) {
    return null;
  }

  return { href, position, title };
};

export { extractRankLabel };
