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

type PersonageWork = {
  href: string;
  poster: string;
  rating: string | null;
  title: string;
};

type PersonageWorkRail = {
  allWorksHref: string | null;
  works: PersonageWork[];
};

type PersonageProfile = {
  biography: string[] | null;
  facts: PersonageFact[];
  gallery: PersonageGallery | null;
  id: string;
  name: string;
  portrait: string | null;
  recentWorks: PersonageWorkRail | null;
  representativeWorks: PersonageWorkRail | null;
};

export type {
  PersonageFact,
  PersonageGallery,
  PersonageGalleryImage,
  PersonageProfile,
  PersonageWork,
  PersonageWorkRail,
};
