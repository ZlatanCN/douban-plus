import { useModalClose } from "@/components/modal/modal-close-context";

import { ModalCloseButton } from "./modal-close-button";
import { ModalShell } from "./modal-shell";

const MODAL_ID = "atv-poster-modal";

type PosterModalProps = {
  alt: string;
  onClose: () => void;
  openRequestId?: number;
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

const PosterModal = ({
  alt,
  onClose,
  openRequestId,
  src,
}: PosterModalProps) => (
  <ModalShell
    ariaLabel="海报预览"
    className="atv-modal-overlay"
    id={MODAL_ID}
    onClose={onClose}
    openRequestId={openRequestId}
    surfaceClassName="atv-modal-surface"
  >
    <PosterModalContent alt={alt} src={src} />
  </ModalShell>
);

export { PosterModal };
