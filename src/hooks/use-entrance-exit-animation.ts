import type { RefCallback } from "preact";
import { useCallback, useLayoutEffect, useRef, useState } from "preact/hooks";

import { animateWithReducedMotion } from "@/utils/springs";
import type { SpringConfig } from "@/utils/springs";

type EntranceExitResult = {
  /** Whether the element should exist in the DOM right now. */
  rendered: boolean;
  /** Attach to the animated element's `ref`. */
  setRef: RefCallback<HTMLDivElement>;
};

/**
 * Owns the mount/unmount animation lifecycle for a panel that appears when
 * content arrives and disappears when it should no longer render:
 *
 * - **Entrance**: fires once when `hasContent` flips false → true (e.g. a
 *   rating resolves). If the element hasn't mounted yet, the entrance is
 *   deferred until the ref attaches.
 * - **Exit**: fires when `shouldRender` flips true → false. The element stays
 *   mounted (`rendered` stays true) until the exit animation finishes, then
 *   `rendered` flips false to unmount.
 * - **Interruption**: a generation counter cancels stale exit animations if a
 *   new state arrives mid-exit, so the panel never disappears behind a
 *   superseded exit promise.
 *
 * Callers pass `shouldRender` (gate) and `hasContent` (trigger) and receive
 * `{ rendered, setRef }` — the six refs and the async exit bookkeeping stay
 * internal.
 */
const useEntranceExitAnimation = (
  shouldRender: boolean,
  hasContent: boolean,
  springConfig: SpringConfig
): EntranceExitResult => {
  const [rendered, setRendered] = useState(shouldRender);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<ReturnType<
    typeof animateWithReducedMotion
  > | null>(null);
  const animationGenerationRef = useRef(0);
  const desiredRenderRef = useRef(shouldRender);
  const pendingEntranceRef = useRef(false);
  const prevHasContentRef = useRef(false);

  const stopAnimation = useCallback(() => {
    animationGenerationRef.current += 1;
    animationRef.current?.stop();
    animationRef.current = null;
  }, []);

  const animateEntrance = useCallback(
    (panel: HTMLDivElement) => {
      stopAnimation();
      animationRef.current = animateWithReducedMotion(panel, {
        properties: {
          opacity: [0, 1],
          transform: ["translateY(4px)", "translateY(0)"],
        },
        reducedMotionProperties: { opacity: [0, 1] },
        springConfig,
      });
    },
    [springConfig, stopAnimation]
  );

  const animateExit = useCallback(
    (panel: HTMLDivElement) => {
      stopAnimation();
      const generation = animationGenerationRef.current;
      const animation = animateWithReducedMotion(panel, {
        properties: {
          opacity: [1, 0],
          transform: ["translateY(0)", "translateY(-4px)"],
        },
        reducedMotionProperties: { opacity: [1, 0] },
        springConfig,
      });
      animationRef.current = animation;
      return { animation, generation };
    },
    [springConfig, stopAnimation]
  );

  const setRef = useCallback(
    (element: HTMLDivElement | null) => {
      panelRef.current = element;
      if (element && pendingEntranceRef.current) {
        pendingEntranceRef.current = false;
        animateEntrance(element);
      }
    },
    [animateEntrance]
  );

  useLayoutEffect(() => {
    const wasDesired = desiredRenderRef.current;
    desiredRenderRef.current = shouldRender;
    const justLoaded = hasContent && !prevHasContentRef.current;
    prevHasContentRef.current = hasContent;

    if (shouldRender) {
      if (!wasDesired) {
        stopAnimation();
      }
      if (justLoaded) {
        const panel = panelRef.current;
        if (panel) {
          animateEntrance(panel);
        } else {
          pendingEntranceRef.current = true;
        }
      }
      setRendered(true);
      return;
    }

    pendingEntranceRef.current = false;
    const panel = panelRef.current;
    if (!panel) {
      setRendered(false);
      return;
    }

    const { animation, generation } = animateExit(panel);

    void (async () => {
      try {
        await animation.finished;
        if (
          animationGenerationRef.current === generation &&
          !desiredRenderRef.current
        ) {
          animationRef.current = null;
          setRendered(false);
        }
      } catch {
        // A new state superseded this exit animation.
      }
    })();
  }, [animateEntrance, animateExit, hasContent, shouldRender, stopAnimation]);

  useLayoutEffect(() => stopAnimation, [stopAnimation]);

  return { rendered, setRef };
};

export { useEntranceExitAnimation };
export type { EntranceExitResult };
