import { useState } from "preact/hooks";

import { PlayIcon } from "@/components/common/icons";
import { Section } from "@/components/layout/section";
import type { ResolvedPhoto } from "@/modules/subject-page/types";
import type { Trailer } from "@/types";

import { getSubjectSectionCopy } from "../section-copy";

type PhotosSectionProps = {
  data: {
    photos: ResolvedPhoto[];
    subjectId: string;
    trailers: Trailer[];
  };
  onOpenPoster?: (src: string, alt: string) => void;
  onOpenVideo?: (trailer: Trailer) => void;
  resolvingPhotos?: boolean;
};

const noop = (): undefined => undefined;

const PhotoTile = ({
  onOpenPoster,
  photo,
}: {
  onOpenPoster: (src: string, alt: string) => void;
  photo: ResolvedPhoto;
}) => {
  const primarySrc = photo.hdUrl || photo.thumbUrl;
  const [displaySrc, setDisplaySrc] = useState(primarySrc);

  return (
    <button
      class="atv-photo-tile"
      onClick={() => onOpenPoster(photo.hdUrl || photo.thumbUrl, "剧照")}
      style={{ "--atv-photo-aspect-ratio": String(photo.aspectRatio) }}
      type="button"
    >
      <img
        alt="剧照"
        loading="lazy"
        onError={() => {
          if (photo.thumbUrl && displaySrc !== photo.thumbUrl) {
            setDisplaySrc(photo.thumbUrl);
          }
        }}
        src={displaySrc}
      />
    </button>
  );
};

const PhotosSection = ({
  data,
  onOpenPoster = noop,
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
          : data.photos.map((photo) => (
              <PhotoTile
                key={photo.link}
                onOpenPoster={onOpenPoster}
                photo={photo}
              />
            ))}
      </div>
    </Section>
  );
};

export { PhotoTile, PhotosSection };
export type { PhotosSectionProps };
