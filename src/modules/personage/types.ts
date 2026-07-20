type PersonageFact = {
  label: string;
  value: string;
};

type PersonageGalleryImage = {
  alt: string;
  largeSrc: string;
  src: string;
};

type PersonageGallery = {
  allImagesHref: string | null;
  images: PersonageGalleryImage[];
};

type PersonageProfile = {
  biography: string[] | null;
  facts: PersonageFact[];
  gallery: PersonageGallery | null;
  id: string;
  name: string;
  portrait: string | null;
};

export type {
  PersonageFact,
  PersonageGallery,
  PersonageGalleryImage,
  PersonageProfile,
};
