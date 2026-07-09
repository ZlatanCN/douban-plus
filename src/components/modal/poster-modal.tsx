import { render } from "preact";

import { useModalClose } from "@/components/modal/modal-close-context";

import { ModalCloseButton } from "./modal-close-button";
import { ModalShell } from "./modal-shell";

const MODAL_ID = "atv-poster-modal";

type PosterModalProps = {
  alt: string;
  onClose: () => void;
  src: string;
};

const removeExistingPosterModal = (): void => {
  const existing = document.querySelector(`#${MODAL_ID}`);
  const host = existing?.parentElement;
  if (host) {
    render(null, host);
    host.remove();
  } else {
    existing?.remove();
  }
};

const PosterModalContent = ({
  alt,
  src,
}: Pick<PosterModalProps, "alt" | "src">) => {
  const close = useModalClose();
  return (
    <>
      <ModalCloseButton ariaLabel="关闭海报" onClick={close} />
      <img alt={alt || ""} class="atv-modal-img" src={src} />
    </>
  );
};

const PosterModal = ({ alt, onClose, src }: PosterModalProps) => (
  <ModalShell
    ariaLabel="海报预览"
    className="atv-modal-overlay"
    id={MODAL_ID}
    onClose={onClose}
    surfaceClassName="atv-modal-surface"
  >
    <PosterModalContent alt={alt} src={src} />
  </ModalShell>
);

const openPosterModal = (src: string, alt: string): void => {
  removeExistingPosterModal();

  const previousFocus =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  const host = document.createElement("div");
  document.body.append(host);

  const close = (): void => {
    render(null, host);
    host.remove();
    if (previousFocus?.isConnected) {
      previousFocus.focus();
    }
  };

  render(<PosterModal alt={alt} onClose={close} src={src} />, host);
};

export { openPosterModal };
