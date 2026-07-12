import { useEffect, useRef, useState } from "preact/hooks";

import type { NavSection, TitleInfo } from "@/types";

type StickyNavProps = {
  doc?: Document;
  sections: NavSection[];
  title: Pick<TitleInfo, "full" | "primary">;
};

const StickyNav = ({ doc = document, sections, title }: StickyNavProps) => {
  const [activeSectionId, setActiveSectionId] = useState("");
  const [visible, setVisible] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const lastVisibleRef = useRef(false);

  useEffect(() => {
    let scrollTimer: ReturnType<typeof setTimeout> | undefined;

    const handleScroll = (): void => {
      const isVisible = window.scrollY > 300;
      if (isVisible !== lastVisibleRef.current) {
        lastVisibleRef.current = isVisible;
        setVisible(isVisible);
      }

      setScrolling(true);
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => setScrolling(false), 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimer);
    };
  }, []);

  useEffect(() => {
    const els = new Map<string, Element>();
    for (const section of sections) {
      const el = doc.querySelector(`#${section.id}`);
      if (el) {
        els.set(section.id, el);
      }
    }
    let pending = false;

    const pick = (): void => {
      let activeId = "";
      let bestScore = -Infinity;
      for (const section of sections) {
        const el = els.get(section.id);
        if (!el) {
          continue;
        }
        const rect = el.getBoundingClientRect();
        const visibleTop = Math.max(rect.top, 56);
        const visibleBottom = Math.min(rect.bottom, window.innerHeight * 0.55);
        const score = Math.max(0, visibleBottom - visibleTop);
        if (score > bestScore) {
          activeId = section.id;
          bestScore = score;
        }
      }
      setActiveSectionId(activeId);
      pending = false;
    };

    const observer = new IntersectionObserver(
      () => {
        if (pending) {
          return;
        }
        pending = true;
        requestAnimationFrame(pick);
      },
      { threshold: [0, 0.25, 0.5] }
    );

    for (const el of els.values()) {
      observer.observe(el);
    }

    pick();

    return () => observer.disconnect();
  }, [doc, sections]);

  return (
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
