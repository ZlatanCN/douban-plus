import type { NavSection, TitleInfo } from "@/types";

type StickyNavProps = {
  activeSectionId?: string;
  onJump: (sectionId: string) => void;
  scrolling?: boolean;
  sections: NavSection[];
  title: Pick<TitleInfo, "full" | "primary">;
  visible?: boolean;
};

const StickyNav = ({
  activeSectionId = "",
  onJump,
  scrolling = false,
  sections,
  title,
  visible = false,
}: StickyNavProps) => (
  <nav
    class={`atv-stickynav${visible ? " is-visible" : ""}${scrolling ? " is-scrolling" : ""}`}
  >
    <div class="atv-stickynav-title">{title.primary || title.full}</div>
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
