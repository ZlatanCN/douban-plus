import { animate } from "motion";
import { useCallback, useEffect, useRef } from "preact/hooks";

import { springConfigs } from "@/utils/springs";

export type SwipeToDismissOptions = {
  dismissThreshold?: number;
  velocityThreshold?: number;
  onDismiss: (details: SwipeDismissDetails) => void;
};

export type SwipeDismissDetails = {
  position: number;
  velocity: number;
};

const readTranslateY = (element: HTMLElement): number => {
  const computedTransform = getComputedStyle(element).transform;
  const transform = element.style.transform || computedTransform;
  const translateMatch = transform.match(
    /translateY\((?<translateY>-?[\d.]+)px\)/u
  );
  if (translateMatch?.groups?.translateY) {
    return Number(translateMatch.groups.translateY);
  }

  const matrixMatch = transform.match(
    /^matrix\([^,]+,[^,]+,[^,]+,[^,]+,[^,]+,\s*(?<translateY>-?[\d.]+)\)$/u
  );
  return matrixMatch?.groups?.translateY
    ? Number(matrixMatch.groups.translateY)
    : 0;
};

const rubberBand = (distance: number): number => -Math.min(distance * 0.35, 96);

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
  const baseTranslationRef = useRef(0);
  const currentDeltaRef = useRef(0);
  const currentPositionRef = useRef(0);
  const activePointerIdRef = useRef<number | null>(null);
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
      if (activePointerIdRef.current !== null) {
        return;
      }
      stopAnimation();
      const element = event.currentTarget as HTMLElement;
      elementRef.current = element;
      startYRef.current = event.clientY;
      baseTranslationRef.current = readTranslateY(element);
      currentDeltaRef.current = 0;
      currentPositionRef.current = baseTranslationRef.current;
      pointerHistoryRef.current = [
        { time: performance.now(), y: event.clientY },
      ];
      activePointerIdRef.current = event.pointerId;
      element.setPointerCapture(event.pointerId);
    },
    [stopAnimation]
  );

  const handlePointerMove = useCallback((event: PointerEvent) => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    if (event.pointerId !== activePointerIdRef.current) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const position =
      baseTranslationRef.current + event.clientY - startYRef.current;
    currentPositionRef.current =
      position < 0 ? rubberBand(-position) : position;
    currentDeltaRef.current = Math.max(0, position);

    const history = pointerHistoryRef.current;
    history.push({ time: performance.now(), y: event.clientY });
    if (history.length > 5) {
      history.shift();
    }

    element.style.transform = `translateY(${currentPositionRef.current}px)`;
  }, []);

  const settlePointer = useCallback((element: HTMLElement) => {
    const delta = currentDeltaRef.current;
    const position = currentPositionRef.current;
    const history = pointerHistoryRef.current;

    currentDeltaRef.current = 0;
    currentPositionRef.current = 0;
    baseTranslationRef.current = 0;

    const {
      dismissThreshold = 80,
      velocityThreshold = 300,
      onDismiss,
    } = optionsRef.current;

    let velocity = 0;
    if (history.length >= 2) {
      const [first] = history;
      const last = history.at(-1);
      if (first && last) {
        const dt = (last.time - first.time) / 1000;
        if (dt > 0) {
          velocity = (last.y - first.y) / dt;
        }
      }
    }

    if (delta > dismissThreshold || velocity > velocityThreshold) {
      onDismiss({ position, velocity });
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

  const handlePointerEnd = useCallback(
    (event: PointerEvent) => {
      const element = elementRef.current;
      if (element && event.pointerId === activePointerIdRef.current) {
        activePointerIdRef.current = null;
        settlePointer(element);
      }
    },
    [settlePointer]
  );

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
