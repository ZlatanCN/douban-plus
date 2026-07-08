import { useState } from "preact/hooks";

import { PosterPlaceholder } from "../../../components/common/poster-placeholder";
import { openPosterModal } from "../../../components/modal";
import type { TitleInfo } from "../../../types";

type HeroPosterProps = {
  poster: string | null;
  title: TitleInfo;
};

const HeroPoster = ({ poster, title }: HeroPosterProps) => {
  const [failed, setFailed] = useState(false);

  return (
    <button
      class="atv-poster-card"
      onClick={() => {
        if (poster) {
          openPosterModal(poster, title.primary || "");
        }
      }}
      type="button"
    >
      {poster && !failed ? (
        <img
          alt={title.primary || ""}
          onError={() => setFailed(true)}
          src={poster}
        />
      ) : (
        <PosterPlaceholder />
      )}
    </button>
  );
};

export { HeroPoster };
export type { HeroPosterProps };
