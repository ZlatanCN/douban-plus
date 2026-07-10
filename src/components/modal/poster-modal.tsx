import { useModalClose } from "@/components/modal/modal-close-context";

import { openImperativeModal } from "./imperative-modal";
import { ModalCloseButton } from "./modal-close-button";
import { ModalShell } from "./modal-shell";

const MODAL_ID = "atv-poster-modal";

type PosterModalProps = {
  alt: string;
  onClose: () => void;
  src: string;
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
  openImperativeModal({
    content: (close) => <PosterModal alt={alt} onClose={close} src={src} />,
    id: MODAL_ID,
  });
};

export { PosterModal, openPosterModal };
