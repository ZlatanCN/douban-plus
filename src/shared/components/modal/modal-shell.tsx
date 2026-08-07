import type { ComponentChildren } from "preact";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "preact/hooks";

import {
  animateWithReducedMotion,
  springConfigs,
} from "@/shared/utils/springs";

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

type ModalPhase = "open" | "closing";

type ModalShellProps = {
  ariaDescribedBy?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  children: ComponentChildren;
  className: string;
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
  id,
  onClose,
  surfaceClassName,
}: ModalShellProps) => {
  const overlayRef = useRef<HTMLDialogElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
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
      const surfaceAnimation = animateWithReducedMotion(surface, {
        properties: {
          opacity: opening ? 1 : 0,
          transform: opening
            ? "scale(1) translateY(0)"
            : EXITING_SURFACE_TRANSFORM,
        },
        reducedMotionProperties: { opacity: opening ? 1 : 0 },
        springConfig: springConfigs.modalSurface,
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
          ref={surfaceRef}
          role="none"
          style={{
            opacity: 0,
            transform: reducedMotion ? "none" : ENTERING_SURFACE_TRANSFORM,
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
