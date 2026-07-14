import type { ComponentChild } from "preact";

import type { NavSection, TitleInfo } from "@/types";

type StickyNavProps = {
  activeSectionId?: string;
  onJump: (sectionId: string) => void;
  scrolling?: boolean;
  sections: NavSection[];
  subjectSwitcherOpen?: boolean;
  subjectSwitcher?: ComponentChild;
  title: Pick<TitleInfo, "full" | "primary">;
  visible?: boolean;
};

const StickyNav = ({
  activeSectionId = "",
  onJump,
  scrolling = false,
  sections,
  subjectSwitcherOpen = false,
  subjectSwitcher,
  title,
  visible = false,
}: StickyNavProps) => (
  <nav
    class={`atv-stickynav${visible ? " is-visible" : ""}${scrolling ? " is-scrolling" : ""}${subjectSwitcherOpen ? " has-subject-switcher-open" : ""}`}
  >
    <div class="atv-stickynav-title">
      {subjectSwitcherOpen ? "上一部" : title.primary || title.full}
    </div>
    {subjectSwitcher ? (
      <div class="atv-stickynav-subject-switcher">{subjectSwitcher}</div>
    ) : null}
    <div class="atv-stickynav-jumps">
      {sections.map((section) => (
        <a
          class={activeSectionId === section.id ? "is-active" : undefined}
          href={`#${section.id}`}
          key={section.id}
          onClick={(event) => {
            event.preventDefault();
            onJump(section.id);
          }}
        >
          {section.label}
        </a>
      ))}
    </div>
  </nav>
);

export { StickyNav };
export type { StickyNavProps };
