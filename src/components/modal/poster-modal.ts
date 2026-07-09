import { el } from "../dom-factory";
import { createOverlay } from "../overlay";

export const openPosterModal = (src: string, alt: string): void => {
  const img = el("img", {
    alt: alt || "",
    className: "atv-modal-img",
    src,
  });

  createOverlay({
    className: "atv-modal-overlay",
    content: [img],
    id: "atv-poster-modal",
  });
};
