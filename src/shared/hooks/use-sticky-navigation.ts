import { useCallback, useEffect, useRef, useState } from "preact/hooks";

import { stickyNavPreference } from "@/shared/runtime/sticky-nav-preference";
import {
  animateWithReducedMotion,
  springConfigs,
} from "@/shared/utils/springs";

type StickyNavigationSection = {
  id: string;
  label: string;
};

type StickyNavigation = {
  activeSectionId: string;
  navRef: { current: HTMLElement | null };
  onJump: (sectionId: string) => void;
  scrolling: boolean;
  sections: readonly StickyNavigationSection[];
  visible: boolean;
};

const SCROLL_BOUNDARY_TOLERANCE = 1;

const getScrollMarginTop = (element: Element, view: Window): number => {
  const scrollMarginTop = Number(
    view.getComputedStyle(element).scrollMarginTop.replace("px", "")
  );
  return Number.isFinite(scrollMarginTop) ? scrollMarginTop : 0;
};

const useStickyNavigation = (
  doc: Document,
  sections: readonly StickyNavigationSection[]
): StickyNavigation => {
  const [activeSectionId, setActiveSectionId] = useState("");
  const [scrolledPastThreshold, setScrolledPastThreshold] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const [mode, setMode] = useState(stickyNavPreference.getMode);
  const lastScrolledPastThresholdRef = useRef(false);
  const navRef = useRef<HTMLElement | null>(null);
  const visible = mode === "always" || scrolledPastThreshold;

  const moveFocusOutOfNavigation = useCallback(() => {
    const nav = navRef.current;
    if (!nav || !nav.contains(doc.activeElement)) {
      return;
    }
    const focusTarget =
      doc.querySelector<HTMLElement>("#atv-douban-root") ?? doc.body;
    focusTarget.focus({ preventScroll: true });
  }, [doc]);

  /* ── User visibility preference ───────────────────────── */
  useEffect(
    () =>
      stickyNavPreference.subscribe((nextMode) => {
        if (nextMode === "auto" && !scrolledPastThreshold) {
          moveFocusOutOfNavigation();
        }
        setMode(nextMode);
      }),
    [moveFocusOutOfNavigation, scrolledPastThreshold]
  );

  /* ── Scroll visibility & activity ───────────────────── */
  useEffect(() => {
    const view = doc.defaultView ?? window;
    let scrollTimer: number | undefined;

    const handleScroll = (): void => {
      const isPastRevealThreshold = view.scrollY > 300;
      if (isPastRevealThreshold !== lastScrolledPastThresholdRef.current) {
        lastScrolledPastThresholdRef.current = isPastRevealThreshold;
        if (!isPastRevealThreshold && mode === "auto") {
          moveFocusOutOfNavigation();
        }
        setScrolledPastThreshold(isPastRevealThreshold);
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
  }, [doc, mode, moveFocusOutOfNavigation]);

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

  /* ── Section intersection tracking ──────────────────── */
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
    let frame: number | undefined;

    const pick = (): void => {
      let activeId = sections[0]?.id ?? "";
      for (const section of sections) {
        const element = elements.get(section.id);
        if (!element) {
          continue;
        }
        const rect = element.getBoundingClientRect();
        if (
          rect.top <=
          getScrollMarginTop(element, view) + SCROLL_BOUNDARY_TOLERANCE
        ) {
          activeId = section.id;
        }
      }
      setActiveSectionId(activeId);
      pending = false;
      frame = undefined;
    };

    const schedulePick = (): void => {
      if (pending) {
        return;
      }
      pending = true;
      frame = view.requestAnimationFrame(pick);
    };

    const observer = new view.IntersectionObserver(schedulePick, {
      threshold: [0, 0.25, 0.5],
    });

    for (const element of elements.values()) {
      observer.observe(element);
    }
    view.addEventListener("scroll", schedulePick, { passive: true });
    pick();

    return () => {
      observer.disconnect();
      view.removeEventListener("scroll", schedulePick);
      if (frame !== undefined) {
        view.cancelAnimationFrame(frame);
      }
    };
  }, [doc, sections]);

  /* ── Smooth jump to section ─────────────────────────── */
  const onJump = useCallback(
    (sectionId: string): void => {
      const view = doc.defaultView ?? window;
      const target = doc.querySelector<HTMLElement>(`#${sectionId}`);
      if (!target) {
        return;
      }

      const prefersReducedMotion = view.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      view.history.pushState(null, "", `#${sectionId}`);
      target.tabIndex = -1;
      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
      target.focus({ preventScroll: true });
    },
    [doc]
  );

  return { activeSectionId, navRef, onJump, scrolling, sections, visible };
};

export { useStickyNavigation };
export type { StickyNavigation, StickyNavigationSection };
