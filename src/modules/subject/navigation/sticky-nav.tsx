import type { ComponentChild } from "preact";

import type { TitleInfo } from "@/modules/subject/domain";
import { StickyNav } from "@/shared/components/layout";
import type { StickyNavProps } from "@/shared/components/layout/sticky-nav";

type SubjectStickyNavProps = Omit<
  StickyNavProps,
  "accessory" | "className" | "title"
> & {
  subjectSwitcher?: ComponentChild;
  title: Pick<TitleInfo, "full" | "primary" | "seasonLabel">;
};

const SubjectStickyNav = ({
  subjectSwitcher,
  title,
  ...navigation
}: SubjectStickyNavProps) => {
  const displayTitle =
    title.seasonLabel && title.primary
      ? `${title.primary} ${title.seasonLabel}`
      : title.primary || title.full;

  return (
    <StickyNav
      {...navigation}
      accessory={
        subjectSwitcher ? (
          <div class="atv-stickynav-subject-switcher">{subjectSwitcher}</div>
        ) : null
      }
      title={displayTitle}
    />
  );
};

export { SubjectStickyNav };
export type { SubjectStickyNavProps };
