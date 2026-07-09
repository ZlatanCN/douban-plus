import { useState } from "preact/hooks";

import { PosterPlaceholder } from "./poster-placeholder";

type PosterImageProps = {
  alt: string;
  className?: string;
  poster: string;
};

const PosterImage = ({ alt, className, poster }: PosterImageProps) => {
  const [failed, setFailed] = useState(false);

  if (!poster || failed) {
    return <PosterPlaceholder />;
  }

  return (
    <img
      alt={alt}
      class={className}
      loading="lazy"
      onError={() => setFailed(true)}
      src={poster}
    />
  );
};

export { PosterImage };
export type { PosterImageProps };
