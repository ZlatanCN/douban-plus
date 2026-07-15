import { useEffect } from "preact/hooks";

const REVEAL_THRESHOLD = 0;

/**
 * Reveals a section (toggles `is-revealed`) the first time it scrolls into
 * the viewport. The visual fade/slide lives in CSS (`.atv-section-reveal`);
 * this hook only flips the class so the work stays on the compositor and the
 * page never ships a permanently-hidden section.
 *
 * Reduced-motion and IntersectionObserver-less environments mark the section
 * revealed immediately — the CSS reduced-motion branch keeps it visible
 * without any movement.
 */
const useSectionReveal = (ref: { current: HTMLElement | null }): void => {
  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion || typeof IntersectionObserver === "undefined") {
      element.classList.add("is-revealed");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            element.classList.add("is-revealed");
            observer.unobserve(element);
          }
        }
      },
      { threshold: [REVEAL_THRESHOLD] }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref]);
};

export { useSectionReveal };
