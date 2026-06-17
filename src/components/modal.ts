import { el } from "./dom-factory";

function openPosterModal(src: string, alt: string): void {
  const old = document.getElementById("atv-poster-modal");
  if (old) {
    old.remove();
  }

  const overlay = el("div", {
    className: "atv-modal-overlay",
    id: "atv-poster-modal",
  });
  const img = el("img", {
    className: "atv-modal-img",
    src,
    alt: alt || "",
  });

  const close = el("button", {
    className: "atv-modal-close",
    attrs: { type: "button" },
    html: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg>',
  });

  const dismiss = (): void => {
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
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

  overlay.appendChild(img);
  overlay.appendChild(close);
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => overlay.classList.add("is-open"));
}

export { openPosterModal };
