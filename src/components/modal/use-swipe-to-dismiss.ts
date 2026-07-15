import { animate } from "motion";
import { useCallback, useEffect, useRef } from "preact/hooks";

import { springConfigs } from "@/utils/springs";

export type SwipeToDismissOptions = {
  dismissThreshold?: number;
  velocityThreshold?: number;
  onDismiss: () => void;
};

const useSwipeToDismiss = (
  options: SwipeToDismissOptions
): {
  ref: (el: HTMLElement | null) => void;
} => {
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const startYRef = useRef(0);
  const currentDeltaRef = useRef(0);
  const pointerHistoryRef = useRef<{ y: number; time: number }[]>([]);
  const animationRef = useRef<ReturnType<typeof animate> | null>(null);
  const animationGenerationRef = useRef(0);
  const elementRef = useRef<HTMLElement | null>(null);

  const stopAnimation = useCallback(() => {
    animationGenerationRef.current += 1;
    animationRef.current?.stop();
    animationRef.current = null;
  }, []);

  const handlePointerDown = useCallback(
    (event: PointerEvent) => {
      stopAnimation();
      const element = event.currentTarget as HTMLElement;
      elementRef.current = element;
      startYRef.current = event.clientY;
      currentDeltaRef.current = 0;
      pointerHistoryRef.current = [];
      element.setPointerCapture(event.pointerId);
    },
    [stopAnimation]
  );

  const handlePointerMove = useCallback((event: PointerEvent) => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    const delta = event.clientY - startYRef.current;
    if (delta < 0) {
      return;
    }

    currentDeltaRef.current = delta;

    const history = pointerHistoryRef.current;
    history.push({ time: performance.now(), y: event.clientY });
    if (history.length > 5) {
      history.shift();
    }

    element.style.transform = `translateY(${delta}px)`;
  }, []);

  const settlePointer = useCallback((element: HTMLElement) => {
    const delta = currentDeltaRef.current;
    const history = pointerHistoryRef.current;

    currentDeltaRef.current = 0;

    const {
      dismissThreshold = 80,
      velocityThreshold = 300,
      onDismiss,
    } = optionsRef.current;

    let velocity = 0;
    if (history.length >= 2) {
      const [first] = history;
      const last = history.at(-1);
      if (last) {
        const dt = (last.time - first.time) / 1000;
        if (dt > 0) {
          velocity = (last.y - first.y) / dt;
        }
      }
    }

    if (delta > dismissThreshold || velocity > velocityThreshold) {
      onDismiss();
      return;
    }

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced) {
      element.style.transform = "";
    } else {
      const animationGeneration = animationGenerationRef.current + 1;
      animationGenerationRef.current = animationGeneration;
      const anim = animate(
        element,
        { transform: "translateY(0)" },
        springConfigs.swipeSettleBack
      );
      animationRef.current = anim;
      void (async () => {
        try {
          await anim.finished;
          if (
            animationGenerationRef.current !== animationGeneration ||
            animationRef.current !== anim
          ) {
            return;
          }
          animationRef.current = null;
          element.style.transform = "";
        } catch {
          // Stopped animations are superseded by the next gesture.
        }
      })();
    }
  }, []);

  const handlePointerEnd = useCallback(() => {
    const element = elementRef.current;
    if (element) {
      settlePointer(element);
    }
  }, [settlePointer]);

  const ref = useCallback(
    (el: HTMLElement | null) => {
      stopAnimation();

      const prevEl = elementRef.current;
      if (prevEl) {
        prevEl.removeEventListener("pointerdown", handlePointerDown);
        prevEl.removeEventListener("pointermove", handlePointerMove);
        prevEl.removeEventListener("pointerup", handlePointerEnd);
        prevEl.removeEventListener("pointercancel", handlePointerEnd);
      }

      if (el) {
        el.addEventListener("pointerdown", handlePointerDown);
        el.addEventListener("pointermove", handlePointerMove);
        el.addEventListener("pointerup", handlePointerEnd);
        el.addEventListener("pointercancel", handlePointerEnd);
        elementRef.current = el;
      } else {
        elementRef.current = null;
      }
    },
    [handlePointerDown, handlePointerEnd, handlePointerMove, stopAnimation]
  );

  return { ref };
};

export { useSwipeToDismiss };
