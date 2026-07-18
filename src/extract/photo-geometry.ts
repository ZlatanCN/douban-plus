type PhotoGeometry = {
  height: number;
  width: number;
};

const PHOTO_DIMENSIONS =
  /大图尺寸\s*[：:]\s*(?<width>\d+)\s*[x×]\s*(?<height>\d+)/u;

const extractPhotoGeometry = (doc: Document): PhotoGeometry | null => {
  const match = PHOTO_DIMENSIONS.exec(doc.body?.textContent ?? "");
  const height = Number(match?.groups?.height);
  const width = Number(match?.groups?.width);

  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height)) {
    return null;
  }
  if (width < 1 || height < 1) {
    return null;
  }
  return { height, width };
};

export { extractPhotoGeometry, type PhotoGeometry };
