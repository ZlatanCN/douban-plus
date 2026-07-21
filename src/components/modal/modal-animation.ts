import type { animateWithReducedMotion } from "@/utils/springs";

const ENTERING_SURFACE_TRANSFORM = "scale(0.92) translateY(8px)";
const EXITING_SURFACE_TRANSFORM = "scale(0.92) translateY(100dvh)";
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

type ModalAnimation = ReturnType<typeof animateWithReducedMotion>;

const prefersReducedMotion = (): boolean =>
  window.matchMedia?.(reducedMotionQuery).matches ?? false;

const finishClosingAnimation = async (
  animationId: number,
  animations: ModalAnimation[],
  animationIdRef: { current: number },
  finishClose: () => void
): Promise<void> => {
  try {
    await Promise.all(animations.map((animation) => animation.finished));
    if (animationId === animationIdRef.current) {
      finishClose();
    }
  } catch {
    // A newer spring interrupted this closing sequence.
  }
};

export {
  ENTERING_SURFACE_TRANSFORM,
  EXITING_SURFACE_TRANSFORM,
  finishClosingAnimation,
  prefersReducedMotion,
  reducedMotionQuery,
};
export type { ModalAnimation };
