import { useEffect } from "preact/hooks";

import type { Trailer } from "@/modules/subject/domain";
import type { TrailerAcquisitionState } from "@/modules/subject/runtime/use-trailer-acquisition";
import { ModalCloseButton, ModalShell } from "@/shared/components/modal";
import { useModalClose } from "@/shared/components/modal/modal-close-context";

const MODAL_ID = "atv-video-modal";

type VideoModalProps = {
  acquisition: TrailerAcquisitionState;
  onClose: () => void;
  trailer: Trailer;
};

const VideoModalContent = ({
  acquisition,
}: Pick<VideoModalProps, "acquisition">) => {
  const close = useModalClose();

  useEffect(() => {
    if (acquisition.status === "fallback") {
      close();
    }
  }, [acquisition.status, close]);

  return (
    <>
      {acquisition.status === "loading" ? null : (
        <ModalCloseButton ariaLabel="关闭视频" onClick={close} />
      )}
      <div class="atv-modal-video-content">
        {acquisition.status === "loading" ? (
          <div class="atv-modal-loading">
            <div class="atv-spinner" />
            <span>加载中...</span>
          </div>
        ) : null}
        {acquisition.status === "loaded" ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption -- Douban trailer embeds do not expose caption tracks.
          <video
            autoplay
            class="atv-modal-video"
            controls
            playsinline
            src={acquisition.embedUrl}
          />
        ) : null}
        {acquisition.status === "failed" ? (
          <div class="atv-modal-toast">视频加载失败</div>
        ) : null}
      </div>
    </>
  );
};

const VideoModal = ({ acquisition, onClose, trailer }: VideoModalProps) => (
  <ModalShell
    ariaLabel={trailer.title || "视频预览"}
    className="atv-modal-overlay is-video"
    id={MODAL_ID}
    onClose={onClose}
    surfaceClassName="atv-modal-surface"
  >
    <VideoModalContent acquisition={acquisition} />
  </ModalShell>
);

export { VideoModal };
