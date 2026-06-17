import { el } from "./dom-factory";

const openPosterModal = (src: string, alt: string): void => {
  const old = document.querySelector("#atv-poster-modal");
  if (old) {
    old.remove();
  }

  const overlay = el("div", {
    className: "atv-modal-overlay",
    id: "atv-poster-modal",
  });
  const img = el("img", {
    alt: alt || "",
    className: "atv-modal-img",
    src,
  });

  const close = el("button", {
    attrs: { type: "button" },
    className: "atv-modal-close",
    html: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg>',
  });

  const dismiss = (): void => {
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
    setTimeout(() => {
      overlay.remove();
    }, 350);
  };

  close.addEventListener("click", dismiss);

  overlay.addEventListener("click", (e: MouseEvent) => {
    if (e.target === overlay) {
      dismiss();
    }
  });

  document.addEventListener("keydown", function handler(e: KeyboardEvent) {
    if (e.key === "Escape") {
      dismiss();
      document.removeEventListener("keydown", handler);
    }
  });

  overlay.append(img);
  overlay.append(close);
  document.body.append(overlay);
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => overlay.classList.add("is-open"));
};

export { openPosterModal };
