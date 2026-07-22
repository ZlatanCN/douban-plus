import type { Trailer } from "@/modules/subject/domain";
import { useTrailerAcquisition } from "@/modules/subject/runtime/use-trailer-acquisition";

import { VideoModal } from "./video-modal";

type TrailerModalProps = {
  onClose: () => void;
  trailer: Trailer;
};

const TrailerModal = ({ onClose, trailer }: TrailerModalProps) => {
  const acquisition = useTrailerAcquisition(trailer);

  return (
    <VideoModal acquisition={acquisition} onClose={onClose} trailer={trailer} />
  );
};

export { TrailerModal, type TrailerModalProps };
