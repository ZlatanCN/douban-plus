import type { ComponentChildren } from "preact";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";

import { trapFocus } from "./focus-trap";
import { ModalCloseContext } from "./modal-close-context";

const TRANSITION_DURATION_MS = 400;

interface ModalShellProps {
  ariaDescribedBy?: string;
  ariaLabelledBy?: string;
  children: ComponentChildren;
  className: string;
  id: string;
  onClose: () => void;
  surfaceClassName: string;
}

const ModalShell = ({
  ariaDescribedBy,
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

  useEffect(() => {
    realOnCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    requestAnimationFrame(() => setIsOpen(true));
  }, []);

  const handleClose = useCallback((): void => {
    if (closing) {
      return;
    }
    setClosing(true);
    setIsOpen(false);
    setTimeout(() => {
      realOnCloseRef.current();
    }, TRANSITION_DURATION_MS);
  }, [closing]);

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
