import { VideoModal } from "@/components/modal";
import { useTrailerAcquisition } from "@/runtime/use-trailer-acquisition";
import type { Trailer } from "@/types";

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
