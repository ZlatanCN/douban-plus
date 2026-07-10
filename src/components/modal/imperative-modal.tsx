import { render } from "preact";
import type { ComponentChild } from "preact";

type ImperativeModalOptions = {
  content: (close: () => void) => ComponentChild;
  id: string;
  onClose?: () => void;
};

type ActiveModal = {
  close: (restoreFocus: boolean) => void;
  host: HTMLElement;
  previousFocus: HTMLElement | null;
};

const activeModals = new Map<string, ActiveModal>();

const removeOrphanedModal = (id: string): void => {
  const existing = document.querySelector(`#${id}`);
  const host = existing?.parentElement;
  if (host) {
    render(null, host);
    host.remove();
    return;
  }
  existing?.remove();
};

const openImperativeModal = (options: ImperativeModalOptions): void => {
  const trackedModal = activeModals.get(options.id);
  const activeModal = trackedModal?.host.isConnected ? trackedModal : undefined;
  if (trackedModal && !activeModal) {
    activeModals.delete(options.id);
  }
  const previousFocus =
    activeModal?.previousFocus ??
    (document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null);
  activeModal?.close(false);
  removeOrphanedModal(options.id);
  const host = document.createElement("div");
  document.body.append(host);
  let closed = false;

  const close = (restoreFocus: boolean): void => {
    if (closed) {
      return;
    }
    closed = true;
    options.onClose?.();
    render(null, host);
    host.remove();
    activeModals.delete(options.id);
    if (restoreFocus && previousFocus?.isConnected) {
      previousFocus.focus();
    }
  };

  activeModals.set(options.id, { close, host, previousFocus });
  render(
    options.content(() => close(true)),
    host
  );
};

export { openImperativeModal };
export type { ImperativeModalOptions };
