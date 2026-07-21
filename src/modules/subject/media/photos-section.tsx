import { PlayIcon } from "@/components/common/icons";
import { SafeImage } from "@/components/common/safe-image";
import { Section } from "@/components/layout/section";
import type { ImageModalSource } from "@/components/modal";
import type { ResolvedPhoto } from "@/modules/subject/types";
import type { Trailer } from "@/types";

import { getSubjectSectionCopy } from "../section-copy";

type PhotosSectionProps = {
  data: {
    photos: ResolvedPhoto[];
    subjectId: string;
    trailers: Trailer[];
  };
  onOpenImage?: (image: ImageModalSource) => void;
  onOpenVideo?: (trailer: Trailer) => void;
  resolvingPhotos?: boolean;
};

const noop = (): undefined => undefined;

const PhotoTile = ({
  onOpenPoster,
  photo,
  staggerIndex = 0,
}: {
  onOpenPoster: (image: ImageModalSource) => void;
  photo: ResolvedPhoto;
  staggerIndex?: number;
}) => (
  <button
    class="atv-photo-tile"
    onClick={() =>
      onOpenPoster({
        alt: "剧照",
        previewSrc: photo.thumbUrl,
        src: photo.hdUrl || photo.thumbUrl,
      })
    }
    style={{
      "--atv-photo-aspect-ratio": String(photo.aspectRatio),
      "--stagger-index": String(staggerIndex),
    }}
    type="button"
  >
    <SafeImage
      alt="剧照"
      aspectRatio={photo.aspectRatio}
      loading="lazy"
      src={photo.thumbUrl || photo.hdUrl}
    />
  </button>
);

const PhotosSection = ({
  data,
  onOpenImage = noop,
  onOpenVideo = noop,
  resolvingPhotos = false,
}: PhotosSectionProps) => {
  const hasMedia =
    resolvingPhotos || data.photos.length > 0 || data.trailers.length > 0;

  if (!hasMedia) {
    return null;
  }

  return (
    <Section
      id="atv-photos"
      {...(data.subjectId
        ? {
            moreLink: {
              href: `https://movie.douban.com/subject/${data.subjectId}/all_photos`,
              text: "查看全部 →",
            },
          }
        : {})}
      title={getSubjectSectionCopy("media").sectionTitle}
    >
      <div class="atv-carousel atv-photos">
        {data.trailers.map((trailer) => (
          <button
            class="atv-photo-tile atv-trailer-tile"
            key={trailer.trailerPageUrl}
            onClick={() => onOpenVideo(trailer)}
            style={{
              backgroundImage: `url("${trailer.thumbUrl}")`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }}
            type="button"
          >
            <div class="atv-trailer-play-overlay">
              <div class="atv-trailer-play-btn">
                <PlayIcon />
              </div>
            </div>
            <span class="atv-trailer-label">{trailer.title || "预告片"}</span>
          </button>
        ))}
        {resolvingPhotos && data.trailers.length === 0 ? (
          <div aria-busy="true" class="atv-photo-rail-reserve" />
        ) : null}
        {resolvingPhotos
          ? null
          : data.photos.map((photo, index) => (
              <PhotoTile
                key={photo.link}
                onOpenPoster={onOpenImage}
                photo={photo}
                staggerIndex={index}
              />
            ))}
      </div>
    </Section>
  );
};

export { PhotoTile, PhotosSection };
export type { PhotosSectionProps };
