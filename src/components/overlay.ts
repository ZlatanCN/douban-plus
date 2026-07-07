/* ── Shared Overlay Factory ─────────────────────────────── */
/* Extracts the dismiss/keyboard/scroll-lock pattern from   */
/* modal implementations.                                    */

import { el } from "./dom-factory";

/* ── Types ──────────────────────────────────────────────── */

type OverlayController = {
  dismiss: () => void;
  overlay: HTMLElement;
  closeBtn: HTMLButtonElement;
};

type CreateOverlayOptions = {
  id: string;
  className?: string | string[];
  content?: HTMLElement[];
  closeButton?: HTMLButtonElement;
  closeSize?: 22 | 16;
  closeIcon?: string;
  onClose?: () => void;
};

const CLOSE_SVG =
  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg>';

/* ── createOverlay ──────────────────────────────────────── */

const createOverlay = (options: CreateOverlayOptions): OverlayController => {
  /* 1. Remove existing overlay with same id */
  const existing = document.querySelector(`#${options.id}`);
  if (existing) {
    existing.remove();
  }

  /* 2. Create overlay div */
  const overlay = el("div", {
    className: options.className || "",
    id: options.id,
  });

  /* 3. Append content elements */
  if (options.content) {
    for (const child of options.content) {
      overlay.append(child);
    }
  }

  /* 4. Create or adopt close button */
  const closeBtn =
    options.closeButton ??
    el("button", {
      attrs: { type: "button" },
      className: "atv-modal-close",
      html: (() => {
        const icon = options.closeIcon ?? CLOSE_SVG;
        return options.closeSize
          ? icon
              .replace(`width="22"`, `width="${options.closeSize}"`)
              .replace(`height="22"`, `height="${options.closeSize}"`)
          : icon;
      })(),
    });
  if (!overlay.contains(closeBtn)) {
    overlay.append(closeBtn);
  }

  /* 5. Dismiss logic */
  let dismissed = false;

  const dismiss = (): void => {
    if (dismissed || !overlay.isConnected) {
      return;
    }
    dismissed = true;
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
    options.onClose?.();
    setTimeout(() => {
      overlay.remove();
    }, 350);
  };

  /* 6. Close button click */
  closeBtn.addEventListener("click", dismiss);

  /* 7. Click outside */
  overlay.addEventListener("click", (e: MouseEvent) => {
    if (e.target === overlay) {
      dismiss();
    }
  });

  /* 8. Escape key */
  const keyHandler = (e: KeyboardEvent): void => {
    if (e.key === "Escape") {
      dismiss();
      document.removeEventListener("keydown", keyHandler);
    }
  };
  document.addEventListener("keydown", keyHandler);

  /* 9. Mount */
  document.body.append(overlay);
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => overlay.classList.add("is-open"));

  return { closeBtn, dismiss, overlay };
};

export { createOverlay };
export type { CreateOverlayOptions, OverlayController };
