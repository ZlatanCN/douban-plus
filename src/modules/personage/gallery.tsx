import { useState } from "preact/hooks";

import { SafeImage } from "@/components/common/safe-image";
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
  largeSrc: string;
  onOpenImage: (image: ImageModalSource) => void;
  src: string;
  staggerIndex: number;
};

const PersonageGalleryImageTile = ({
  alt,
  largeSrc,
  onOpenImage,
  src,
  staggerIndex,
}: PersonageGalleryImageTileProps) => {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  return (
    <li
      style={{
        "--stagger-index": String(staggerIndex),
        ...(aspectRatio
          ? { "--atv-personage-gallery-aspect-ratio": String(aspectRatio) }
          : {}),
      }}
    >
      <button
        aria-label={`查看${alt}`}
        onClick={() => onOpenImage({ alt, previewSrc: src, src: largeSrc })}
        type="button"
      >
        <SafeImage
          alt={alt}
          loading="lazy"
          onLoad={({ width, height }) => setAspectRatio(width / height)}
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
      title="图集"
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
                staggerIndex={index}
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
