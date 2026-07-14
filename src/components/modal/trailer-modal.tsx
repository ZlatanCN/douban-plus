import { useTrailerAcquisition } from "@/runtime/use-trailer-acquisition";
import type { Trailer } from "@/types";

import { VideoModal } from "./video-modal";

type TrailerModalProps = {
  onClose: () => void;
  openRequestId: number;
  trailer: Trailer;
};

const TrailerModal = ({
  onClose,
  openRequestId,
  trailer,
}: TrailerModalProps) => {
  const acquisition = useTrailerAcquisition(trailer);

  return (
    <VideoModal
      acquisition={acquisition}
      onClose={onClose}
      openRequestId={openRequestId}
      trailer={trailer}
    />
  );
};

export { TrailerModal, type TrailerModalProps };
