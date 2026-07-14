import { animate } from "motion";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";

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
  style: { transform?: string };
} => {
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const [deltaY, setDeltaY] = useState(0);

  const startYRef = useRef(0);
  const currentDeltaRef = useRef(0);
  const pointerHistoryRef = useRef<{ y: number; time: number }[]>([]);
  const animationRef = useRef<ReturnType<typeof animate> | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  const handlePointerDown = useCallback((event: PointerEvent) => {
    const element = event.currentTarget as HTMLElement;
    elementRef.current = element;
    startYRef.current = event.clientY;
    currentDeltaRef.current = 0;
    pointerHistoryRef.current = [];
    element.setPointerCapture(event.pointerId);
  }, []);

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
    setDeltaY(delta);
  }, []);

  const handlePointerUp = useCallback(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    const delta = currentDeltaRef.current;
    const history = pointerHistoryRef.current;

    setDeltaY(0);

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
      const anim = animate(
        element,
        { transform: "translateY(0)" },
        springConfigs.swipeToDismiss
      );
      animationRef.current = anim;
      (async () => {
        await anim.finished;
        element.style.transform = "";
      })();
    }
  }, []);

  const ref = useCallback(
    (el: HTMLElement | null) => {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }

      const prevEl = elementRef.current;
      if (prevEl) {
        prevEl.removeEventListener("pointerdown", handlePointerDown);
        prevEl.removeEventListener("pointermove", handlePointerMove);
        prevEl.removeEventListener("pointerup", handlePointerUp);
      }

      if (el) {
        el.addEventListener("pointerdown", handlePointerDown);
        el.addEventListener("pointermove", handlePointerMove);
        el.addEventListener("pointerup", handlePointerUp);
        elementRef.current = el;
      } else {
        elementRef.current = null;
      }
    },
    [handlePointerDown, handlePointerMove, handlePointerUp]
  );

  return {
    ref,
    style: deltaY > 0 ? { transform: `translateY(${deltaY}px)` } : {},
  };
};

export { useSwipeToDismiss };
