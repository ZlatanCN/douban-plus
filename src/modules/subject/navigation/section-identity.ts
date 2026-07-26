/**
 * Subject page section identity manifest.
 *
 * Single source of truth for which sections exist, their DOM IDs, nav labels,
 * and visibility conditions. Both nav computation and section rendering
 * derive from this manifest so adding a section requires only one registration.
 */
import type { DoubanData } from "@/modules/subject/domain";

import { getSubjectSectionCopy } from "./section-copy";

type SubjectSectionEntry = {
  /** DOM id attribute of the section element. */
  id: string;
  /** Whether this section has data and should be shown. */
  visible: (data: DoubanData) => boolean;
  /** Nav label string derived from page data. */
  navLabel: (data: DoubanData) => string;
};

const SUBJECT_SECTIONS: readonly SubjectSectionEntry[] = [
  {
    id: "atv-stream",
    navLabel: () => getSubjectSectionCopy("streaming").navLabel,
    visible: (d) => d.streaming.length > 0,
  },
  {
    id: "atv-series",
    navLabel: () => getSubjectSectionCopy("series").navLabel,
    visible: (d) => d.series.length > 0,
  },
  {
    id: "atv-cast",
    navLabel: () => getSubjectSectionCopy("cast").navLabel,
    visible: (d) => d.celebrities.length > 0,
  },
  {
    id: "atv-photos",
    navLabel: () => getSubjectSectionCopy("media").navLabel,
    visible: (d) => d.photos.length > 0 || d.trailers.length > 0,
  },
  {
    id: "atv-comments",
    navLabel: () => getSubjectSectionCopy("comments").navLabel,
    visible: (d) => d.comments.length > 0,
  },
  {
    id: "atv-reviews",
    navLabel: (d) =>
      getSubjectSectionCopy(d.isTV ? "tvReviews" : "movieReviews").navLabel,
    visible: (d) => d.reviews.length > 0,
  },
  {
    id: "atv-discussions",
    navLabel: () => getSubjectSectionCopy("discussions").navLabel,
    visible: (d) => d.discussions.topics.length > 0,
  },
  {
    id: "atv-recs",
    navLabel: () => getSubjectSectionCopy("recommendations").navLabel,
    visible: (d) => d.recommendations.length > 0,
  },
  {
    id: "atv-info",
    navLabel: () => getSubjectSectionCopy("details").navLabel,
    visible: () => true,
  },
] as const;

export { SUBJECT_SECTIONS };
export type { SubjectSectionEntry };
