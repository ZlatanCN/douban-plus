import { useState } from "preact/hooks";

import { PosterPlaceholder } from "@/components/common/poster-placeholder";
import type { TitleInfo } from "@/types";

type HeroPosterProps = {
  onOpenPoster?: (src: string, alt: string) => void;
  poster: string | null;
  title: TitleInfo;
};

const noop = (): undefined => undefined;

const HeroPoster = ({
  onOpenPoster = noop,
  poster,
  title,
}: HeroPosterProps) => {
  const [failed, setFailed] = useState(false);

  return (
    <button
      class="atv-poster-card"
      onClick={() => {
        if (poster) {
          onOpenPoster(poster, title.primary || "");
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
