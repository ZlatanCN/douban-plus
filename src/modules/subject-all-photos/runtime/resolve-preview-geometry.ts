import type {
  ResolvedSubjectAllPhotosPageData,
  ResolvedSubjectPhotoPreview,
  SubjectAllPhotosPageData,
  SubjectPhotoPreview,
} from "../domain";
import { archivePhotoSource } from "../domain/photo-source";

const FALLBACK_ASPECT_RATIO = 1;
const PREVIEW_GEOMETRY_CONCURRENCY = 12;
const PREVIEW_GEOMETRY_TIMEOUT_MS = 900;

type ResolvePhotoAspectRatio = (
  photo: SubjectPhotoPreview
) => Promise<number | null>;

const isAspectRatio = (value: number | null): value is number =>
  value !== null && Number.isFinite(value) && value > 0;

const resolvePreviewGeometry = async (
  data: SubjectAllPhotosPageData,
  resolveAspectRatio: ResolvePhotoAspectRatio
): Promise<ResolvedSubjectAllPhotosPageData> => {
  const groups = data.groups.map((group) => ({
    ...group,
    photos: group.photos.map(
      (photo): ResolvedSubjectPhotoPreview => ({
        ...photo,
        aspectRatio: FALLBACK_ASPECT_RATIO,
      })
    ),
  }));
  const previews = data.groups.flatMap((group, groupIndex) =>
    group.photos.map((photo, photoIndex) => ({
      groupIndex,
      photo,
      photoIndex,
    }))
  );
  let nextPreviewIndex = 0;

  const resolveNextPreview = async (): Promise<void> => {
    const preview = previews[nextPreviewIndex];
    nextPreviewIndex += 1;
    if (!preview) {
      return;
    }

    const aspectRatio = await resolveAspectRatio(preview.photo);
    const group = groups[preview.groupIndex];
    const photo = group?.photos[preview.photoIndex];
    if (photo && isAspectRatio(aspectRatio)) {
      photo.aspectRatio = aspectRatio;
    }

    await resolveNextPreview();
  };

  await Promise.all(
    Array.from(
      { length: Math.min(PREVIEW_GEOMETRY_CONCURRENCY, previews.length) },
      resolveNextPreview
    )
  );

  return { ...data, groups };
};

const loadPhotoAspectRatio = (doc: Document): ResolvePhotoAspectRatio => {
  const ImageConstructor = doc.defaultView?.Image;
  if (!ImageConstructor) {
    return () => Promise.resolve(null);
  }

  return (photo) =>
    // oxlint-disable-next-line promise/avoid-new -- image events are the browser's geometry API.
    new Promise((resolve) => {
      const image = new ImageConstructor();
      const view = doc.defaultView ?? window;
      const state: { settled: boolean; timer: number | undefined } = {
        settled: false,
        timer: undefined,
      };
      const handlers: { onError: () => void; onLoad: () => void } = {
        onError: (): undefined => undefined,
        onLoad: (): undefined => undefined,
      };
      const settle = (
        aspectRatio: number | null,
        cancelImageRequest = false
      ): void => {
        if (state.settled) {
          return;
        }

        state.settled = true;
        if (state.timer !== undefined) {
          view.clearTimeout(state.timer);
        }
        image.removeEventListener("error", handlers.onError);
        image.removeEventListener("load", handlers.onLoad);
        if (cancelImageRequest) {
          image.src = "";
        }
        resolve(aspectRatio);
      };
      handlers.onLoad = (): void =>
        settle(
          image.naturalWidth && image.naturalHeight
            ? image.naturalWidth / image.naturalHeight
            : null
        );
      handlers.onError = (): void => settle(null);
      image.addEventListener("load", handlers.onLoad, { once: true });
      image.addEventListener("error", handlers.onError, { once: true });
      state.timer = view.setTimeout(
        () => settle(null, true),
        PREVIEW_GEOMETRY_TIMEOUT_MS
      );
      image.src = archivePhotoSource(photo.src).src;
    });
};

export {
  FALLBACK_ASPECT_RATIO,
  loadPhotoAspectRatio,
  PREVIEW_GEOMETRY_CONCURRENCY,
  PREVIEW_GEOMETRY_TIMEOUT_MS,
  resolvePreviewGeometry,
};
export type { ResolvePhotoAspectRatio };
