import { useState } from "preact/hooks";

import { Section } from "@/components/layout/section";
import type { ImageModalSource } from "@/components/modal";

import type { PersonageGallery } from "./types";

type PersonageGallerySectionProps = {
  gallery: PersonageGallery | null;
  name: string;
  onOpenImage?: (image: ImageModalSource) => void;
};

const noop = (): undefined => undefined;

type PersonageGalleryImageTileProps = {
  alt: string;
  onOpenImage: (image: ImageModalSource) => void;
  src: string;
  largeSrc: string;
};

const PersonageGalleryImageTile = ({
  alt,
  largeSrc,
  onOpenImage,
  src,
}: PersonageGalleryImageTileProps) => {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  return (
    <li
      {...(aspectRatio
        ? {
            style: {
              "--atv-personage-gallery-aspect-ratio": String(aspectRatio),
            },
          }
        : {})}
    >
      <button
        aria-label={`查看${alt}`}
        onClick={() => onOpenImage({ alt, previewSrc: src, src: largeSrc })}
        type="button"
      >
        <img
          alt={alt}
          loading="lazy"
          onLoad={(event) => {
            const image = event.currentTarget;
            if (image.naturalWidth && image.naturalHeight) {
              setAspectRatio(image.naturalWidth / image.naturalHeight);
            }
          }}
          src={src}
        />
      </button>
    </li>
  );
};

const PersonageGallerySection = ({
  gallery,
  name,
  onOpenImage = noop,
}: PersonageGallerySectionProps) => {
  if (!gallery) {
    return null;
  }

  return (
    <Section
      id="atv-personage-gallery"
      {...(gallery.allImagesHref
        ? {
            moreLink: {
              href: gallery.allImagesHref,
              text: "查看全部 →",
            },
          }
        : {})}
      title="图片"
    >
      {gallery.images.length > 0 ? (
        <ul
          aria-label={`${name}的图片`}
          class="atv-carousel atv-personage-gallery-rail"
        >
          {gallery.images.map((image, index) => {
            const alt = image.alt || `${name}的图片 ${index + 1}`;

            return (
              <PersonageGalleryImageTile
                alt={alt}
                key={image.src}
                largeSrc={image.largeSrc}
                onOpenImage={onOpenImage}
                src={image.src}
              />
            );
          })}
        </ul>
      ) : (
        <p class="atv-personage-gallery-empty">暂无公开图片</p>
      )}
    </Section>
  );
};

export { PersonageGallerySection };
export type { PersonageGallerySectionProps };
