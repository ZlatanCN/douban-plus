import { extractPhotoGeometry } from "@/modules/subject/extract/photo-geometry";
import type { PhotoGeometry } from "@/modules/subject/extract/photo-geometry";
import { createCache } from "@/shared/utils/cache";
import { gmGet } from "@/shared/utils/request";

const PHOTO_GEOMETRY_CACHE_TTL_MS = 365 * 24 * 60 * 60 * 1000;
const photoGeometryCache = createCache<PhotoGeometry>(
  "dp:photo-geometry-cache",
  PHOTO_GEOMETRY_CACHE_TTL_MS
);
const photoGeometryRequests = new Map<string, Promise<PhotoGeometry | null>>();

const isDoubanPhotoDetailUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "movie.douban.com" &&
      /^\/photos\/photo\/\d+\/?$/u.test(url.pathname)
    );
  } catch {
    return false;
  }
};

const loadPhotoGeometry = async (
  photoLink: string,
  referer: string
): Promise<PhotoGeometry | null> => {
  try {
    const html = await gmGet(photoLink, referer);
    const geometry = extractPhotoGeometry(
      new DOMParser().parseFromString(html, "text/html")
    );
    if (geometry) {
      photoGeometryCache.set(photoLink, geometry);
    }
    return geometry;
  } catch {
    return null;
  } finally {
    photoGeometryRequests.delete(photoLink);
  }
};

const fetchPhotoGeometry = (
  photoLink: string,
  referer: string = location.href
): Promise<PhotoGeometry | null> => {
  if (!isDoubanPhotoDetailUrl(photoLink)) {
    return Promise.resolve(null);
  }

  const cached = photoGeometryCache.get(photoLink);
  if (cached !== undefined) {
    return Promise.resolve(cached);
  }

  const inFlight = photoGeometryRequests.get(photoLink);
  if (inFlight) {
    return inFlight;
  }

  const request = loadPhotoGeometry(photoLink, referer);
  photoGeometryRequests.set(photoLink, request);
  return request;
};

export { fetchPhotoGeometry, isDoubanPhotoDetailUrl };
