import { useState } from "preact/hooks";

import type { TitleInfo } from "@/modules/subject/domain";
import { PosterPlaceholder } from "@/shared/components/common/poster-placeholder";

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
      class="atv-poster-card atv-image-preview-trigger"
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
