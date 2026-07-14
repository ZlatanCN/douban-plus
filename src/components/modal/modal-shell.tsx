import type { ComponentChildren } from "preact";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "preact/hooks";

import { animateWithReducedMotion, springConfigs } from "@/utils/springs";

import { trapFocus } from "./focus-trap";
import { ModalCloseContext } from "./modal-close-context";
import { useSwipeToDismiss } from "./use-swipe-to-dismiss";

const ENTERING_SURFACE_TRANSFORM = "scale(0.92) translateY(8px)";
const EXITING_SURFACE_TRANSFORM = "scale(0.92) translateY(100dvh)";
const SWIPE_DISMISS_DISTANCE = 120;
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

type ModalAnimation = ReturnType<typeof animateWithReducedMotion>;
type ModalPhase = "open" | "closing";

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

type ModalShellProps = {
  ariaDescribedBy?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  children: ComponentChildren;
  className: string;
  dismissable?: boolean;
  id: string;
  onClose: () => void;
  openRequestId?: number;
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
  openRequestId,
  surfaceClassName,
}: ModalShellProps) => {
  const overlayRef = useRef<HTMLDialogElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const closeSourceRef = useRef<"standard" | "swipe">("standard");
  const realOnCloseRef = useRef(onClose);
  const [phase, setPhase] = useState<ModalPhase>("open");
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  const didFinishCloseRef = useRef(false);
  const animationIdRef = useRef(0);
  const animationsRef = useRef<ModalAnimation[]>([]);
  const previousOpenRequestIdRef = useRef(openRequestId);

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
          ? `translateY(${SWIPE_DISMISS_DISTANCE}px)`
          : EXITING_SURFACE_TRANSFORM;
      const surfaceSpring =
        closeSourceRef.current === "swipe"
          ? springConfigs.swipeDismiss
          : springConfigs.modalSurface;
      if (!opening) {
        closeSourceRef.current = "standard";
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
    if (previousOpenRequestIdRef.current === openRequestId) {
      return;
    }
    previousOpenRequestIdRef.current = openRequestId;
    didFinishCloseRef.current = false;
    setPhase("open");
    animateModal("open");
  }, [animateModal, openRequestId]);

  const handleClose = useCallback((): void => {
    if (didFinishCloseRef.current) {
      return;
    }
    didFinishCloseRef.current = false;
    setPhase("closing");
    animateModal("closed");
  }, [animateModal]);

  const handleSwipeDismiss = useCallback(() => {
    closeSourceRef.current = "swipe";
    handleClose();
  }, [handleClose]);
  const swipe = useSwipeToDismiss({
    onDismiss: dismissable
      ? handleSwipeDismiss
      : () => {
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

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeydown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        handleClose();
        return;
      }
      const surface = surfaceRef.current;
      if (surface) {
        trapFocus(event, surface);
      }
    };

    document.addEventListener("keydown", onKeydown);
    requestAnimationFrame(() => surfaceRef.current?.focus());

    return () => {
      document.removeEventListener("keydown", onKeydown);
      document.body.style.overflow = previousOverflow;
    };
  }, [handleClose]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) {
      return;
    }
    const onClick = (event: MouseEvent): void => {
      if (event.target === overlay) {
        handleClose();
      }
    };
    overlay.addEventListener("click", onClick);
    return () => overlay.removeEventListener("click", onClick);
  }, [handleClose]);

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
            ...(dismissable
              ? { touchAction: "pan-x" as const, ...swipe.style }
              : {}),
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
