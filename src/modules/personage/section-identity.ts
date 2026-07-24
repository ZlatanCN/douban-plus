/**
 * Personage page section identity manifest.
 *
 * Single source of truth for which sections exist, their DOM IDs, nav labels,
 * and visibility conditions. Both nav computation and section rendering
 * derive from this manifest so adding a section requires only one registration.
 */
import type { PersonageProfile } from "./domain";

type PersonageSectionEntry = {
  /** DOM id attribute of the section element. */
  id: string;
  /** Whether this section has data and should be shown. */
  visible: (profile: PersonageProfile) => boolean;
  /** Nav label string derived from profile data. */
  navLabel: (profile: PersonageProfile) => string;
};

const PERSONAGE_SECTIONS: readonly PersonageSectionEntry[] = [
  {
    id: "atv-personage-awards",
    navLabel: () => "荣誉",
    visible: (p) => (p.awards?.awards.length ?? 0) > 0,
  },
  {
    id: "atv-personage-recent-works",
    navLabel: () => "近作",
    visible: (p) => (p.recentWorks?.works.length ?? 0) > 0,
  },
  {
    id: "atv-personage-representative-works",
    navLabel: () => "作品选",
    visible: (p) => (p.representativeWorks?.works.length ?? 0) > 0,
  },
  {
    id: "atv-personage-collaborators",
    navLabel: () => "合作",
    visible: (p) => (p.collaborators?.collaborators.length ?? 0) > 0,
  },
  {
    id: "atv-personage-gallery",
    navLabel: () => "图集",
    visible: (p) => (p.gallery?.images.length ?? 0) > 0,
  },
] as const;

export { PERSONAGE_SECTIONS };
export type { PersonageSectionEntry };
