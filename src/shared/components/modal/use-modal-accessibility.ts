import { useEffect } from "preact/hooks";

import { trapFocus } from "./focus-trap";

type ElementRef<T extends HTMLElement> = { current: T | null };

type UseModalAccessibilityOptions = {
  onClose: () => void;
  overlayRef: ElementRef<HTMLDialogElement>;
  surfaceRef: ElementRef<HTMLDivElement>;
};

const useModalAccessibility = ({
  onClose,
  overlayRef,
  surfaceRef,
}: UseModalAccessibilityOptions): void => {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeydown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
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
  }, [onClose, surfaceRef]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) {
      return;
    }
    const onClick = (event: MouseEvent): void => {
      if (event.target === overlay) {
        onClose();
      }
    };
    overlay.addEventListener("click", onClick);
    return () => overlay.removeEventListener("click", onClick);
  }, [onClose, overlayRef]);
};

export { useModalAccessibility };
