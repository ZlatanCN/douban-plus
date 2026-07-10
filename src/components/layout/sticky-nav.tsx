import { useEffect, useState } from "preact/hooks";

import type { NavSection, TitleInfo } from "@/types";

type StickyNavProps = {
  doc?: Document;
  sections: NavSection[];
  title: Pick<TitleInfo, "full" | "primary">;
};

const StickyNav = ({ doc = document, sections, title }: StickyNavProps) => {
  const [activeSectionId, setActiveSectionId] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = (): void => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", updateVisibility, { passive: true });
    updateVisibility();
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      () => {
        let activeId = "";
        let bestScore = -Infinity;
        for (const section of sections) {
          const element = doc.querySelector(`#${section.id}`);
          if (!element) {
            continue;
          }
          const rect = element.getBoundingClientRect();
          const visibleTop = Math.max(rect.top, 56);
          const visibleBottom = Math.min(
            rect.bottom,
            window.innerHeight * 0.55
          );
          const score = Math.max(0, visibleBottom - visibleTop);
          if (score > bestScore) {
            activeId = section.id;
            bestScore = score;
          }
        }
        setActiveSectionId(activeId);
      },
      { threshold: [0, 0.25, 0.5] }
    );
    for (const section of sections) {
      const element = doc.querySelector(`#${section.id}`);
      if (element) {
        observer.observe(element);
      }
    }
    return () => observer.disconnect();
  }, [doc, sections]);

  return (
    <nav class={`atv-stickynav${visible ? " is-visible" : ""}`}>
      <div class="atv-stickynav-title">{title.primary || title.full}</div>
      <div class="atv-stickynav-jumps">
        {sections.map((section) => (
          <a
            class={activeSectionId === section.id ? "is-active" : undefined}
            href={`#${section.id}`}
            key={section.id}
            onClick={(event) => {
              event.preventDefault();
              doc
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
