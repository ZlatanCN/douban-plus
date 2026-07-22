import { PosterPlaceholder } from "./poster-placeholder";
import { SafeImage } from "./safe-image";

type PosterImageProps = {
  alt: string;
  className?: string;
  poster: string;
};

const PosterImage = ({ alt, className, poster }: PosterImageProps) => (
  <SafeImage
    alt={alt}
    {...(className ? { className } : {})}
    fallback={<PosterPlaceholder />}
    loading="lazy"
    src={poster}
  />
);

export { PosterImage };
export type { PosterImageProps };
