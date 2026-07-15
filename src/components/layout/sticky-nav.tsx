import type { ComponentChild } from "preact";
import { useLayoutEffect, useRef } from "preact/hooks";

import type { NavSection, TitleInfo } from "@/types";

type IndicatorMetrics = {
  left: number;
  width: number;
};

/**
 * Computes the offset (from the container's left edge) and width of the
 * currently-active jump link so a single sliding marker can be positioned
 * over it. Pure and layout-only — easy to unit test without a real browser.
 */
const computeIndicatorMetrics = (
  activeEl: HTMLElement,
  containerEl: HTMLElement
): IndicatorMetrics => {
  const containerRect = containerEl.getBoundingClientRect();
  const activeRect = activeEl.getBoundingClientRect();
  return {
    left: activeRect.left - containerRect.left,
    width: activeRect.width,
  };
};

type StickyNavProps = {
  activeSectionId?: string;
  navRef?: { current: HTMLElement | null };
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
  navRef,
  onJump,
  scrolling = false,
  sections,
  subjectSwitcherOpen = false,
  subjectSwitcher,
  title,
  visible = false,
}: StickyNavProps) => {
  const markerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!activeSectionId) {
      return;
    }
    const nav = navRef?.current;
    const marker = markerRef.current;
    if (!nav || !marker) {
      return;
    }
    const container = nav.querySelector<HTMLElement>(".atv-stickynav-jumps");
    const activeLink = nav.querySelector<HTMLElement>(
      `[data-section-id="${activeSectionId}"]`
    );
    if (!container || !activeLink) {
      return;
    }

    // Measure on the next frame so layout (fonts, widths) has settled and we
    // avoid reading layout inside the layout-effect pass (layout thrash).
    const frame = requestAnimationFrame(() => {
      const { left, width } = computeIndicatorMetrics(activeLink, container);
      marker.style.transform = `translateX(${left}px)`;
      marker.style.width = `${width}px`;
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [activeSectionId, navRef]);

  return (
    <nav
      ref={navRef}
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
            data-section-id={section.id}
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
        <div aria-hidden="true" class="atv-stickynav-marker" ref={markerRef} />
      </div>
    </nav>
  );
};

export { StickyNav, computeIndicatorMetrics };
export type { StickyNavProps };
