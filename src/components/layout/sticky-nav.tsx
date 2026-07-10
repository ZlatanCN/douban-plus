import { useEffect, useState } from "preact/hooks";

import type { NavSection, TitleInfo } from "@/types";

type StickyNavProps = {
  sections: NavSection[];
  title: Pick<TitleInfo, "full" | "primary">;
};

const StickyNav = ({ sections, title }: StickyNavProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = (): void => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", updateVisibility, { passive: true });
    updateVisibility();
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  return (
    <nav class={`atv-stickynav${visible ? " is-visible" : ""}`}>
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
    </nav>
  );
};

export { StickyNav };
export type { StickyNavProps };
