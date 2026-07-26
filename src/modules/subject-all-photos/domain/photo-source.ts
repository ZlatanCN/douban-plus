type ArchivePhotoSource = {
  sizes?: string;
  src: string;
  srcSet?: string;
};

const archivePhotoSource = (src: string): ArchivePhotoSource => {
  if (!src.includes("/view/photo/sqxs/")) {
    return { src };
  }

  const smallSrc = src.replace("/view/photo/sqxs/", "/view/photo/s/");
  const mediumSrc = src.replace("/view/photo/sqxs/", "/view/photo/m/");

  return {
    sizes: "(max-width: 768px) 50vw, (max-width: 1200px) 20vw, 14vw",
    src: smallSrc,
    srcSet: `${smallSrc} 270w, ${mediumSrc} 540w`,
  };
};

export { archivePhotoSource };
export type { ArchivePhotoSource };
