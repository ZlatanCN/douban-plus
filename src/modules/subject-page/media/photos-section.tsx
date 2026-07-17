import { useState } from "preact/hooks";

import { PlayIcon } from "@/components/common/icons";
import { Section } from "@/components/layout/section";
import type { Photo, PhotosData, Trailer } from "@/types";

import { getSubjectSectionCopy } from "../section-copy";

type PhotosSectionProps = {
  data: PhotosData;
  onOpenPoster?: (src: string, alt: string) => void;
  onOpenVideo?: (trailer: Trailer) => void;
};

const noop = (): undefined => undefined;

const PhotoTile = ({
  onOpenPoster,
  photo,
}: {
  onOpenPoster: (src: string, alt: string) => void;
  photo: Photo;
}) => {
  const primarySrc = photo.hdUrl || photo.thumbUrl;
  const [displaySrc, setDisplaySrc] = useState(primarySrc);
  const [isPortrait, setIsPortrait] = useState(false);

  return (
    <button
      class={`atv-photo-tile${isPortrait ? " is-portrait" : ""}`}
      onClick={() => onOpenPoster(photo.hdUrl || photo.thumbUrl, "剧照")}
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
        onLoad={(event) => {
          const img = event.currentTarget;
          if (img.naturalHeight > img.naturalWidth) {
            setIsPortrait(true);
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
}: PhotosSectionProps) =>
  data.photos.length || data.trailers.length ? (
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
        {data.photos.map((photo) => (
          <PhotoTile
            key={photo.link}
            onOpenPoster={onOpenPoster}
            photo={photo}
          />
        ))}
      </div>
    </Section>
  ) : null;

export { PhotoTile, PhotosSection };
export type { PhotosSectionProps };
