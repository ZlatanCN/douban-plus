import { useState } from "preact/hooks";

import { useModalClose } from "@/components/modal/modal-close-context";

import { ModalCloseButton } from "./modal-close-button";
import { ModalShell } from "./modal-shell";

const MODAL_ID = "atv-poster-modal";

type ImageModalSource = {
  alt: string;
  previewSrc?: string;
  src: string;
};

type PosterModalProps = ImageModalSource & {
  onClose: () => void;
};

const PosterModalContent = ({ alt, previewSrc, src }: ImageModalSource) => {
  const close = useModalClose();
  const hasPreview = Boolean(previewSrc && previewSrc !== src);
  const [imageState, setImageState] = useState<
    "loaded" | "loading" | "preview"
  >(hasPreview ? "loading" : "loaded");

  return (
    <div class={`atv-image-modal-frame is-${imageState}`}>
      <ModalCloseButton
        ariaLabel="关闭图片预览"
        className="atv-image-modal-close"
        onClick={close}
      />
      {hasPreview ? (
        <img
          alt=""
          aria-hidden="true"
          class="atv-modal-preview"
          src={previewSrc}
        />
      ) : null}
      <img
        alt={alt || ""}
        class="atv-modal-img"
        onError={() => {
          if (hasPreview) {
            setImageState("preview");
          }
        }}
        onLoad={() => setImageState("loaded")}
        src={src}
      />
      {imageState === "loading" ? (
        <output aria-live="polite" class="atv-image-modal-loading">
          <span aria-hidden="true" class="atv-spinner" />
          <span>加载图片中…</span>
        </output>
      ) : null}
    </div>
  );
};

const PosterModal = ({ alt, onClose, previewSrc, src }: PosterModalProps) => (
  <ModalShell
    ariaLabel="海报预览"
    className="atv-modal-overlay"
    id={MODAL_ID}
    onClose={onClose}
    surfaceClassName="atv-modal-surface"
  >
    <PosterModalContent
      alt={alt}
      key={src}
      {...(previewSrc ? { previewSrc } : {})}
      src={src}
    />
  </ModalShell>
);

export { PosterModal };
export type { ImageModalSource, PosterModalProps };
