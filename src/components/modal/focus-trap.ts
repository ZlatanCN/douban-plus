const focusableSelector = [
  "button:not([disabled])",
  "iframe",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

const focusableElements = (root: HTMLElement): HTMLElement[] =>
  [...root.querySelectorAll<HTMLElement>(focusableSelector)].filter(
    (node) =>
      !node.hasAttribute("disabled") &&
      node.getAttribute("aria-hidden") !== "true"
  );

const trapFocus = (event: KeyboardEvent, root: HTMLElement): void => {
  if (event.key !== "Tab") {
    return;
  }

  const focusable = focusableElements(root);
  if (!focusable.length) {
    event.preventDefault();
    root.focus();
    return;
  }

  const [first] = focusable;
  const last = focusable.at(-1);
  const active = document.activeElement;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last?.focus();
    return;
  }

  if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
};

export { focusableElements, focusableSelector, trapFocus };
