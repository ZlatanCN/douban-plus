/* ── Spring Parameter Constants & Reduced‑Motion Utility ── */
/* Single source of truth for all Apple‑style spring params.  */

import { animate } from "motion";

/* ── Spring Configs ──────────────────────────────────── */

const springConfigs = {
  carouselSnap: { damping: 18, stiffness: 200, type: "spring" as const },
  contentEntrance: { damping: 28, stiffness: 300, type: "spring" as const },
  modalBackdrop: { bounce: 0, duration: 0.4, type: "spring" as const },
  modalSurface: { bounce: 0, duration: 0.35, type: "spring" as const },
  ratingEntrance: { bounce: 0, duration: 0.3, type: "spring" as const },
  reviewBodyEntrance: { bounce: 0, duration: 0.35, type: "spring" as const },
  stickyNav: { bounce: 0, duration: 0.3, type: "spring" as const },
  summaryEntrance: { bounce: 0, duration: 0.3, type: "spring" as const },
  swipeToDismiss: { damping: 15, stiffness: 180, type: "spring" as const },
};

type SpringConfig = (typeof springConfigs)[keyof typeof springConfigs];

/* ── Reduced‑Motion Utility ──────────────────────────── */

const animateWithReducedMotion = (
  element: Element,
  options: {
    properties: Record<string, string | number | (string | number)[]>;
    reducedMotionProperties?: Record<
      string,
      string | number | (string | number)[]
    >;
    springConfig?: SpringConfig;
  }
) => {
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReduced) {
    return animate(
      element,
      options.reducedMotionProperties ?? options.properties,
      { duration: 0.2 }
    );
  }

  return animate(
    element,
    options.properties,
    options.springConfig ?? springConfigs.contentEntrance
  );
};

export { animateWithReducedMotion, springConfigs, type SpringConfig };
