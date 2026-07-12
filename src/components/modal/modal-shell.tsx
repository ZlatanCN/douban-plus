import type { ComponentChildren } from "preact";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";

import { trapFocus } from "./focus-trap";
import { ModalCloseContext } from "./modal-close-context";

const CLOSE_FALLBACK_DURATION_MS = 500;

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
  const [isOpen, setIsOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const realOnCloseRef = useRef(onClose);
  const closeFallbackRef = useRef<number>();
  const didFinishCloseRef = useRef(false);

  useEffect(() => {
    realOnCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    requestAnimationFrame(() => setIsOpen(true));
  }, []);

  const finishClose = useCallback((): void => {
    if (didFinishCloseRef.current) {
      return;
    }
    didFinishCloseRef.current = true;
    if (closeFallbackRef.current !== undefined) {
      window.clearTimeout(closeFallbackRef.current);
    }
    realOnCloseRef.current();
  }, []);

  const handleClose = useCallback((): void => {
    if (closing) {
      return;
    }
    didFinishCloseRef.current = false;
    setClosing(true);
    setIsOpen(false);
  }, [closing]);

  useEffect(() => {
    if (!closing) {
      return;
    }
    const overlay = overlayRef.current;
    const onTransitionEnd = (event: TransitionEvent): void => {
      if (event.target === overlay && event.propertyName === "opacity") {
        finishClose();
      }
    };

    overlay?.addEventListener("transitionend", onTransitionEnd);
    closeFallbackRef.current = window.setTimeout(
      finishClose,
      CLOSE_FALLBACK_DURATION_MS
    );

    return () => {
      overlay?.removeEventListener("transitionend", onTransitionEnd);
      if (closeFallbackRef.current !== undefined) {
        window.clearTimeout(closeFallbackRef.current);
      }
    };
  }, [closing, finishClose]);

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

  const openClass = isOpen ? " is-open" : "";

  return (
    <ModalCloseContext.Provider value={handleClose}>
      <dialog
        aria-describedby={ariaDescribedBy}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-modal="true"
        class={`${className}${openClass}`}
        id={id}
        open
        ref={overlayRef}
      >
        <div
          class={surfaceClassName}
          onClick={(event) => event.stopPropagation()}
          ref={surfaceRef}
          role="none"
          tabindex={-1}
        >
          {children}
        </div>
      </dialog>
    </ModalCloseContext.Provider>
  );
};

export { ModalShell };
export type { ModalShellProps };
