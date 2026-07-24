import type { DoubanData, NavSection } from "@/modules/subject/domain";

import { SUBJECT_SECTIONS } from "./section-identity";

const computeNavSections = (data: DoubanData): NavSection[] =>
  SUBJECT_SECTIONS.filter((entry) => entry.visible(data)).map((entry) => ({
    id: entry.id,
    label: entry.navLabel(data),
  }));

export { computeNavSections };
