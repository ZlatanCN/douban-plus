import type { ComponentChildren } from "preact";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "preact/hooks";

import { animateWithReducedMotion, springConfigs } from "@/utils/springs";

import {
  ENTERING_SURFACE_TRANSFORM,
  EXITING_SURFACE_TRANSFORM,
  finishClosingAnimation,
  prefersReducedMotion,
  reducedMotionQuery,
} from "./modal-animation";
import type { ModalAnimation } from "./modal-animation";
import { ModalCloseContext } from "./modal-close-context";
import { useModalSession } from "./modal-session";
import { useModalAccessibility } from "./use-modal-accessibility";
import { useSwipeToDismiss } from "./use-swipe-to-dismiss";
import type { SwipeDismissDetails } from "./use-swipe-to-dismiss";

type ModalPhase = "open" | "closing";

type ModalShellProps = {
  ariaDescribedBy?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  children: ComponentChildren;
  className: string;
  dismissable?: boolean;
  id: string;
  onClose: () => void;
  surfaceClassName: string;
};

const ModalShell = ({
  ariaDescribedBy,
  ariaLabel,
  ariaLabelledBy,
  children,
  className,
  dismissable = false,
  id,
  onClose,
  surfaceClassName,
}: ModalShellProps) => {
  const overlayRef = useRef<HTMLDialogElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const closeSourceRef = useRef<"standard" | "swipe">("standard");
  const swipeDismissRef = useRef<SwipeDismissDetails | null>(null);
  const realOnCloseRef = useRef(onClose);
  const [phase, setPhase] = useState<ModalPhase>("open");
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  const didFinishCloseRef = useRef(false);
  const animationIdRef = useRef(0);
  const animationsRef = useRef<ModalAnimation[]>([]);
  const session = useModalSession();
  const previousSessionRef = useRef(session);

  useEffect(() => {
    realOnCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const mediaQuery = window.matchMedia?.(reducedMotionQuery);
    if (!mediaQuery) {
      return;
    }
    const updateReducedMotion = (): void =>
      setReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", updateReducedMotion);
    return () => mediaQuery.removeEventListener("change", updateReducedMotion);
  }, []);

  const finishClose = useCallback((): void => {
    if (didFinishCloseRef.current) {
      return;
    }
    didFinishCloseRef.current = true;
    realOnCloseRef.current();
  }, []);

  const animateModal = useCallback(
    (state: "open" | "closed"): void => {
      const overlay = overlayRef.current;
      const surface = surfaceRef.current;
      if (!overlay || !surface) {
        return;
      }

      for (const animation of animationsRef.current) {
        animation.stop();
      }

      const animationId = animationIdRef.current + 1;
      animationIdRef.current = animationId;
      const opening = state === "open";
      const backdropAnimation = animateWithReducedMotion(overlay, {
        properties: { opacity: opening ? 1 : 0 },
        reducedMotionProperties: { opacity: opening ? 1 : 0 },
        springConfig: springConfigs.modalBackdrop,
      });
      const surfaceExitTransform =
        closeSourceRef.current === "swipe"
          ? "translateY(100dvh)"
          : EXITING_SURFACE_TRANSFORM;
      const surfaceSpring =
        closeSourceRef.current === "swipe"
          ? {
              ...springConfigs.swipeDismissExit,
              velocity: swipeDismissRef.current?.velocity ?? 0,
            }
          : springConfigs.modalSurface;
      if (!opening) {
        closeSourceRef.current = "standard";
        swipeDismissRef.current = null;
      }
      const surfaceAnimation = animateWithReducedMotion(surface, {
        properties: {
          opacity: opening ? 1 : 0,
          transform: opening ? "scale(1) translateY(0)" : surfaceExitTransform,
        },
        reducedMotionProperties: { opacity: opening ? 1 : 0 },
        springConfig: surfaceSpring,
      });
      animationsRef.current = [backdropAnimation, surfaceAnimation];

      if (!opening) {
        void finishClosingAnimation(
          animationId,
          [backdropAnimation, surfaceAnimation],
          animationIdRef,
          finishClose
        );
      }
    },
    [finishClose]
  );

  useLayoutEffect(() => {
    if (previousSessionRef.current === session) {
      return;
    }
    previousSessionRef.current = session;
    didFinishCloseRef.current = false;
    setPhase("open");
    animateModal("open");
  }, [animateModal, session]);

  const handleClose = useCallback((): void => {
    if (didFinishCloseRef.current) {
      return;
    }
    didFinishCloseRef.current = false;
    setPhase("closing");
    animateModal("closed");
  }, [animateModal]);

  const handleSwipeDismiss = useCallback(
    (details: SwipeDismissDetails) => {
      closeSourceRef.current = "swipe";
      swipeDismissRef.current = details;
      handleClose();
    },
    [handleClose]
  );
  const swipe = useSwipeToDismiss({
    onDismiss: dismissable
      ? handleSwipeDismiss
      : (_details: SwipeDismissDetails) => {
          void 0;
        },
  });
  const surfaceRefCallback = useCallback(
    (el: HTMLDivElement | null) => {
      surfaceRef.current = el;
      if (dismissable) {
        swipe.ref(el);
      }
    },
    [dismissable, swipe]
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const overlay = overlayRef.current;
      if (!overlay) {
        return;
      }
      animateModal("open");
    });

    return () => {
      cancelAnimationFrame(frame);
      for (const animation of animationsRef.current) {
        animation.stop();
      }
    };
  }, [animateModal]);

  useModalAccessibility({ onClose: handleClose, overlayRef, surfaceRef });

  return (
    <ModalCloseContext.Provider value={handleClose}>
      <dialog
        aria-describedby={ariaDescribedBy}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-modal="true"
        class={className}
        id={id}
        open
        ref={overlayRef}
        style={{
          opacity: 0,
          pointerEvents: phase === "open" ? "auto" : "none",
        }}
      >
        <div
          class={surfaceClassName}
          onClick={(event) => event.stopPropagation()}
          ref={dismissable ? surfaceRefCallback : surfaceRef}
          role="none"
          style={{
            opacity: 0,
            transform: reducedMotion ? "none" : ENTERING_SURFACE_TRANSFORM,
            ...(dismissable ? { touchAction: "pan-x" as const } : {}),
          }}
          tabindex={-1}
        >
          {children}
        </div>
      </dialog>
    </ModalCloseContext.Provider>
  );
};

export { ModalShell, type ModalShellProps };
