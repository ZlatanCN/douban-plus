const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const visibleFocusable = (node: HTMLElement): boolean =>
  !node.hasAttribute("disabled") &&
  !node.hidden &&
  node.getAttribute("aria-hidden") !== "true" &&
  node.style.display !== "none" &&
  node.style.visibility !== "hidden";

const trapReviewModalFocus = (
  overlay: HTMLElement,
  initialFocus: HTMLElement
): ((event: KeyboardEvent) => void) => {
  const onKeydown = (event: KeyboardEvent): void => {
    if (event.key !== "Tab") {
      return;
    }

    const focusables = [
      ...overlay.querySelectorAll<HTMLElement>(focusableSelector),
    ].filter(visibleFocusable);
    if (focusables.length === 0) {
      return;
    }

    const [first] = focusables;
    const last = focusables.at(-1) ?? first;
    const active = document.activeElement;

    if (event.shiftKey) {
      if (active === first || active === initialFocus) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (active === last || active === initialFocus) {
      event.preventDefault();
      first.focus();
    }
  };

  overlay.addEventListener("keydown", onKeydown);
  initialFocus.focus({ preventScroll: true });
  return onKeydown;
};

export { trapReviewModalFocus };
