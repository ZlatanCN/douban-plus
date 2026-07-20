import { useEffect, useState } from "preact/hooks";

import { fetchPhotoGeometry } from "@/api/photo-geometry";
import type { PhotoResolution, ResolvedPhoto } from "@/modules/subject/types";
import type { Photo } from "@/types";

const FALLBACK_ASPECT_RATIO = 16 / 9;

const emptyResolution: PhotoResolution = {
  photos: [],
  status: "ready",
};

const resolvingResolution: PhotoResolution = {
  photos: [],
  status: "loading",
};

const resolvePhoto = async (
  photo: Photo,
  referer: string
): Promise<ResolvedPhoto> => {
  try {
    const geometry = await fetchPhotoGeometry(photo.link, referer);
    return {
      ...photo,
      aspectRatio: geometry
        ? geometry.width / geometry.height
        : FALLBACK_ASPECT_RATIO,
    };
  } catch {
    return { ...photo, aspectRatio: FALLBACK_ASPECT_RATIO };
  }
};

const useResolvedPhotoGeometry = (
  photos: Photo[],
  doc: Document
): PhotoResolution => {
  const [resolution, setResolution] = useState<PhotoResolution>(() =>
    photos.length === 0 ? emptyResolution : resolvingResolution
  );

  useEffect(() => {
    if (photos.length === 0) {
      setResolution(emptyResolution);
      return;
    }

    let active = true;
    setResolution(resolvingResolution);
    void (async () => {
      const resolvedPhotos = await Promise.all(
        photos.map((photo) => resolvePhoto(photo, doc.location.href))
      );
      if (active) {
        setResolution({ photos: resolvedPhotos, status: "ready" });
      }
    })();

    return () => {
      active = false;
    };
  }, [doc, photos]);

  return resolution;
};

export { FALLBACK_ASPECT_RATIO, useResolvedPhotoGeometry };
