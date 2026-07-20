import { useCallback, useEffect, useRef, useState } from "preact/hooks";

import type { SubjectPageNavigation } from "@/modules/subject/types";
import type { NavSection } from "@/types";
import { animateWithReducedMotion, springConfigs } from "@/utils/springs";

const useStickyNavigation = (
  doc: Document,
  sections: NavSection[]
): SubjectPageNavigation => {
  const [activeSectionId, setActiveSectionId] = useState("");
  const [visible, setVisible] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const lastVisibleRef = useRef(false);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const view = doc.defaultView ?? window;
    let scrollTimer: number | undefined;

    const handleScroll = (): void => {
      const isVisible = view.scrollY > 300;
      if (isVisible !== lastVisibleRef.current) {
        lastVisibleRef.current = isVisible;
        setVisible(isVisible);
      }

      setScrolling(true);
      view.clearTimeout(scrollTimer);
      scrollTimer = view.setTimeout(() => setScrolling(false), 150);
    };

    view.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      view.removeEventListener("scroll", handleScroll);
      view.clearTimeout(scrollTimer);
    };
  }, [doc]);

  /* ── Spring animation on visibility change ────────────── */
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) {
      return;
    }

    animateWithReducedMotion(nav, {
      properties: visible
        ? { opacity: 1, transform: "translateY(0)" }
        : { opacity: 0, transform: "translateY(-100%)" },
      reducedMotionProperties: { opacity: visible ? 1 : 0 },
      springConfig: springConfigs.stickyNav,
    });
  }, [visible]);

  useEffect(() => {
    const view = doc.defaultView ?? window;
    const elements = new Map<string, Element>();
    for (const section of sections) {
      const element = doc.querySelector(`#${section.id}`);
      if (element) {
        elements.set(section.id, element);
      }
    }
    let pending = false;

    const pick = (): void => {
      let activeId = "";
      let bestScore = -Infinity;
      for (const section of sections) {
        const element = elements.get(section.id);
        if (!element) {
          continue;
        }
        const rect = element.getBoundingClientRect();
        const visibleTop = Math.max(rect.top, 56);
        const visibleBottom = Math.min(rect.bottom, view.innerHeight * 0.55);
        const score = Math.max(0, visibleBottom - visibleTop);
        if (score > bestScore) {
          activeId = section.id;
          bestScore = score;
        }
      }
      setActiveSectionId(activeId);
      pending = false;
    };

    const observer = new view.IntersectionObserver(
      () => {
        if (pending) {
          return;
        }
        pending = true;
        view.requestAnimationFrame(pick);
      },
      { threshold: [0, 0.25, 0.5] }
    );

    for (const element of elements.values()) {
      observer.observe(element);
    }
    pick();

    return () => observer.disconnect();
  }, [doc, sections]);

  const onJump = useCallback(
    (sectionId: string): void => {
      const view = doc.defaultView ?? window;
      const prefersReducedMotion = view.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      doc.querySelector(`#${sectionId}`)?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    },
    [doc]
  );

  return { activeSectionId, navRef, onJump, scrolling, sections, visible };
};

export { useStickyNavigation };
