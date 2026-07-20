import type { ComponentChild } from "preact";

import { StickyNav } from "@/components/layout";
import type { StickyNavProps } from "@/components/layout/sticky-nav";
import type { TitleInfo } from "@/types";

type SubjectStickyNavProps = Omit<
  StickyNavProps,
  "accessory" | "className" | "title"
> & {
  subjectSwitcher?: ComponentChild;
  subjectSwitcherOpen?: boolean;
  title: Pick<TitleInfo, "full" | "primary">;
};

const SubjectStickyNav = ({
  subjectSwitcher,
  subjectSwitcherOpen = false,
  title,
  ...navigation
}: SubjectStickyNavProps) => (
  <StickyNav
    {...navigation}
    accessory={
      subjectSwitcher ? (
        <div class="atv-stickynav-subject-switcher">{subjectSwitcher}</div>
      ) : null
    }
    className={subjectSwitcherOpen ? "has-subject-switcher-open" : ""}
    title={subjectSwitcherOpen ? "上一部" : title.primary || title.full}
  />
);

export { SubjectStickyNav };
export type { SubjectStickyNavProps };
