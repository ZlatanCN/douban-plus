import { useRef } from "preact/hooks";

import { PlayIcon } from "../../../components/common/icons";
import { Section } from "../../../components/layout/section";
import { openPosterModal, openVideoModal } from "../../../components/modal";
import type { Photo, PhotosData } from "../../../types";

interface PhotosSectionProps {
  data: PhotosData;
}

const PhotoTile = ({ photo }: { photo: Photo }) => {
  const tileRef = useRef<HTMLButtonElement>(null);

  return (
    <button
      class="atv-photo-tile"
      onClick={() => openPosterModal(photo.hdUrl || photo.thumbUrl, "剧照")}
      ref={tileRef}
      type="button"
    >
      <img
        alt="剧照"
        loading="lazy"
        onError={(event) => {
          const img = event.currentTarget as HTMLImageElement;
          if (photo.thumbUrl && img.src !== photo.thumbUrl) {
            img.src = photo.thumbUrl;
          }
        }}
        onLoad={(event) => {
          const img = event.currentTarget as HTMLImageElement;
          if (img.naturalHeight > img.naturalWidth) {
            tileRef.current?.classList.add("is-portrait");
          }
        }}
        src={photo.hdUrl || photo.thumbUrl}
      />
    </button>
  );
};

const PhotosSection = ({ data }: PhotosSectionProps) =>
  data.photos.length || data.trailers.length ? (
    <Section
      id="atv-photos"
      moreLink={
        data.subjectId
          ? {
              href: `https://movie.douban.com/subject/${data.subjectId}/all_photos`,
              text: "查看全部 →",
            }
          : undefined
      }
      title="剧照"
    >
      <div class="atv-carousel atv-photos">
        {data.trailers.map((trailer) => (
          <button
            class="atv-photo-tile atv-trailer-tile"
            key={trailer.trailerPageUrl}
            onClick={() => openVideoModal(trailer)}
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
          <PhotoTile key={photo.link} photo={photo} />
        ))}
      </div>
    </Section>
  ) : null;

export { PhotoTile, PhotosSection };
export type { PhotosSectionProps };
