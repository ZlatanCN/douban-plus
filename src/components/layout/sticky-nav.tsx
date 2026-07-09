import type { NavSection, TitleInfo } from "@/types";

type StickyNavProps = {
  sections: NavSection[];
  title: Pick<TitleInfo, "full" | "primary">;
};

const StickyNav = ({ sections, title }: StickyNavProps) => (
  <>
    <div class="atv-stickynav-title">{title.primary || title.full}</div>
    <div class="atv-stickynav-jumps">
      {sections.map((section) => (
        <a
          href={`#${section.id}`}
          key={section.id}
          onClick={(event) => {
            event.preventDefault();
            document
              .querySelector(`#${section.id}`)
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          {section.label}
        </a>
      ))}
    </div>
  </>
);

export { StickyNav };
export type { StickyNavProps };
